import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

const SPREADSHEET_ID = '13fK8gpFdktyOEPuc5gP3gsLQFrdrCMw80WEYBm6-ENU';

const getDoc = async () => {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!serviceAccountEmail || !privateKey) {
    throw new Error('Google service account credentials not configured.');
  }

  const auth = new JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, auth);
  await doc.loadInfo();
  return doc;
};

export async function getActiveEvent() {
  try {
    const doc = await getDoc();
    const configSheet = doc.sheetsByTitle['Config'];
    if (!configSheet) return null;
    
    const rows = await configSheet.getRows();
    const activeRow = rows.find(r => r.get('Key') === 'ActiveEvent');
    if (!activeRow) return null;

    const name = activeRow.get('Value');
    if (!name || name.trim() === '') return null;

    return {
      name: name,
      activatedAt: activeRow.get('Timestamp') || null
    };
  } catch (error) {
    console.error('getActiveEvent error:', error);
    return null;
  }
}

export async function setActiveEvent(eventName: string) {
  const doc = await getDoc();
  let configSheet = doc.sheetsByTitle['Config'];
  
  if (!configSheet) {
    configSheet = await doc.addSheet({ title: 'Config', headerValues: ['Key', 'Value', 'Timestamp'] });
  } else {
    // Ensure Timestamp header exists
    await configSheet.loadHeaderRow();
    if (!configSheet.headerValues.includes('Timestamp')) {
      await configSheet.setHeaderRow(['Key', 'Value', 'Timestamp']);
    }
  }
  
  const rows = await configSheet.getRows();
  const activeRow = rows.find(r => r.get('Key') === 'ActiveEvent');
  const now = new Date().toISOString();
  
  if (activeRow) {
    activeRow.set('Value', eventName);
    activeRow.set('Timestamp', now);
    await activeRow.save();
  } else {
    await configSheet.addRow({ Key: 'ActiveEvent', Value: eventName, Timestamp: now });
  }
}

export async function deactivateActiveEvent() {
  const doc = await getDoc();
  const configSheet = doc.sheetsByTitle['Config'];
  if (!configSheet) return;

  const rows = await configSheet.getRows();
  const activeRow = rows.find(r => r.get('Key') === 'ActiveEvent');
  if (activeRow) {
    const eventName = activeRow.get('Value');
    // Clear active event
    activeRow.set('Value', '');
    activeRow.set('Timestamp', '');
    await activeRow.save();

    // Mark remaining members as Late
    const mainSheet = doc.sheetsByIndex[0];
    const mainRows = await mainSheet.getRows();
    let updatedCount = 0;
    
    for (const row of mainRows) {
      const status = row.get(eventName);
      if (!status || status.trim() === '') {
        row.set(eventName, 'Late');
        await row.save();
        updatedCount++;
      }
    }
    console.log(`Deactivated ${eventName}. Marked ${updatedCount} members as Late.`);
  }
}

export async function getEvents() {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;
    return headers.slice(1);
  } catch (error: any) {
    console.error('getEvents error:', error.message);
    throw new Error(`Failed to fetch events: ${error.message}`);
  }
}

export async function getEventCategories() {
  try {
    const doc = await getDoc();
    const configSheet = doc.sheetsByTitle['Config'];
    if (!configSheet) return {};
    
    const rows = await configSheet.getRows();
    const categories: Record<string, string> = {};
    rows.forEach(row => {
      const key = row.get('Key');
      if (key?.startsWith('Cat:')) {
        categories[key.replace('Cat:', '')] = row.get('Value');
      }
    });
    return categories;
  } catch (error) {
    return {};
  }
}

export async function addEvent(eventName: string, category: string) {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadHeaderRow();
    const headers = [...sheet.headerValues, eventName];
    await sheet.setHeaderRow(headers);

    // Save category
    let configSheet = doc.sheetsByTitle['Config'];
    if (!configSheet) {
      configSheet = await doc.addSheet({ title: 'Config', headerValues: ['Key', 'Value', 'Timestamp'] });
    }
    await configSheet.addRow({ Key: `Cat:${eventName}`, Value: category });

  } catch (error: any) {
    console.error('addEvent error:', error.message);
    throw new Error(`Failed to add event: ${error.message}`);
  }
}

export async function checkIn(name: string, event: string, status: string = 'Attendence') {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    await sheet.loadHeaderRow();
    const headers = sheet.headerValues;
    
    if (!headers.includes(event)) {
      throw new Error(`Invalid event: ${event}`);
    }

    const rows = await sheet.getRows();
    const nameHeader = headers[0]; 

    const row = rows.find(r => r.get(nameHeader) === name);

    if (row) {
      const existingStatus = row.get(event);
      if (existingStatus && existingStatus.trim() !== '') {
        return { success: true, alreadyCheckedIn: true };
      }

      row.set(event, status);
      await row.save();
      return { success: true, alreadyCheckedIn: false };
    }
    return { success: false };
  } catch (error: any) {
    console.error('checkIn error:', error.message);
    throw error;
  }
}

export async function getAttendanceData() {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    const headers = sheet.headerValues;
    
    return rows.map(row => {
      const data: Record<string, string> = {};
      headers.forEach(h => {
        data[h] = row.get(h) || '';
      });
      return data;
    });
  } catch (error) {
    console.error('getAttendanceData error:', error);
    return [];
  }
}
