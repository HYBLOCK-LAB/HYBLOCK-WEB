'use client';

import { GraduationCap, Microscope, Award } from 'lucide-react';
import { useLanguageStore } from '@/lib/auth/language-store';

const content = {
  ko: {
    title: 'Professor',
    name: '유민수',
    engName: 'Minsoo Ryu',
    lab: 'OSDC',
    labFull: 'Operating Systems & Distributed Computing Laboratory',
    researchTitle: '연구 분야',
    research: [
      '블록체인 (BlockChain)',
      '운영체제 (Operating Systems)',
      '임베디드 시스템 (Embedded Systems)',
      '소프트웨어 공학 (Software Engineering)',
    ],
    rolesTitle: '주요 직함',
    roles: [
      '한양대학교 소프트웨어학부 교수',
      '한양대학교 블록체인연구원',
      '학과간블록체인융합학과 주임교수',
      '소프트웨어 영재교육원장',
    ],
  },
  en: {
    title: 'Professor',
    name: 'Minsoo Ryu',
    engName: '유민수',
    lab: 'OSDC',
    labFull: 'Operating Systems & Distributed Computing Laboratory',
    researchTitle: 'Research Interests',
    research: [
      'Blockchain',
      'Operating Systems',
      'Embedded Systems',
      'Software Engineering',
    ],
    rolesTitle: 'Key Positions',
    roles: [
      'Professor, School of Computer Science, Hanyang University',
      'Member, Hanyang University Blockchain Research Institute',
      'Chair, Interdisciplinary Department of Blockchain Convergence',
      'Director, Center for Software Gifted Education',
    ],
  },
};

export default function ProfessorSection() {
  const { language } = useLanguageStore();
  const d = content[language];

  return (
    <section className="bg-white px-8 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-12 items-center">
          {/* Photo Area */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-slate-100 border border-slate-100 shadow-2xl">
              <img 
                src="/professor.png" 
                alt="Minsoo Ryu" 
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e4a84]/20 to-transparent" />
            </div>
          </div>

          {/* Text Area */}
          <div className="lg:col-span-7 space-y-10">
            <div>
              <span className="font-display text-sm font-bold uppercase tracking-[0.3em] text-[#0e4a84]">
                {d.title}
              </span>
              <h2 className="mt-4 text-5xl font-black tracking-tighter text-slate-900">
                {d.name} <span className="text-2xl font-bold text-slate-400 ml-2">{language === 'ko' ? d.engName : d.engName}</span>
              </h2>
              <div className="mt-6 inline-flex flex-col border-l-4 border-[#0e4a84] pl-6">
                <span className="text-xl font-black text-[#0e4a84]">{d.lab}</span>
                <span className="text-sm font-bold text-slate-500">{d.labFull}</span>
              </div>
            </div>

            <div className="grid gap-10 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#0e4a84]">
                  <Microscope className="h-5 w-5" />
                  <h3 className="font-display text-xs font-bold uppercase tracking-widest">{d.researchTitle}</h3>
                </div>
                <ul className="space-y-2">
                  {d.research.map((item) => (
                    <li key={item} className="text-[15px] font-bold text-slate-600 flex items-start gap-2">
                      <span className="text-[#0e4a84] mt-1.5 h-1.5 w-1.5 rounded-full bg-current shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[#0e4a84]">
                  <Award className="h-5 w-5" />
                  <h3 className="font-display text-xs font-bold uppercase tracking-widest">{d.rolesTitle}</h3>
                </div>
                <ul className="space-y-3">
                  {d.roles.map((item) => (
                    <li key={item} className="text-[14px] font-bold leading-snug text-slate-500">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
