import React from 'react';
import { Instagram, Youtube, Phone, MapPin } from 'lucide-react';
import { useStore } from '../store/StoreContext';

interface FooterProps {
  onSelectCategory: (categoryId?: string) => void;
}

const INSTAGRAM_URL = 'https://www.instagram.com/sribhagyalakshmitextiles/';
const YOUTUBE_URL = 'https://youtube.com/@bhagyalakshmiellampillai?si=n5O4juCKw5ld8PuF';

export const Footer: React.FC<FooterProps> = ({ onSelectCategory }) => {
  const { categories } = useStore();

  const exploreLinks = [
    { label: 'Collections', action: () => onSelectCategory() },
    { label: 'Our Story', action: () => document.getElementById('our-story')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Elampillai', action: () => document.getElementById('our-story')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Contact', action: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' }) },
  ];

  return (
    <footer id="contact" className="relative overflow-hidden border-t border-[#6b351d]/70 bg-[#260006] py-12 text-[#F8E8C0] sm:py-14">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(#d7a943 0.8px, transparent 0.8px)', backgroundSize: '12px 12px' }} />
      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 sm:px-10 md:grid-cols-[1.5fr_0.8fr_1fr] lg:px-16">
        <div className="max-w-xl">
          <a href="#home" aria-label="Sri Bhagyalakshmi Textiles home" className="mb-6 inline-flex items-center gap-3">
            <img src="/sbt-logo.png" alt="Sri Bhagyalakshmi Textiles SBT emblem" className="h-[88px] w-[88px] rounded-full object-cover ring-1 ring-[#C89D42]/70 sm:h-24 sm:w-24" />
            <span className="font-serif uppercase leading-tight tracking-wide text-[#E7C16C]">
              <span className="block text-lg sm:text-xl">Sri Bhagyalakshmi</span>
              <span className="mt-1 block text-sm tracking-[0.18em] sm:text-base">Textiles</span>
              <span className="mt-1 block text-[10px] tracking-[0.28em]">Ellampillai</span>
            </span>
          </a>
          <h2 className="mb-5 font-serif text-3xl leading-tight text-[#E7C16C] sm:text-[2.1rem]">The grandeur of silk.<br />The soul of Elampillai.</h2>
          <p className="max-w-lg text-sm leading-8 text-[#D8C9C2] sm:text-base">
            A premium textile house rooted in Elampillai, Salem, bringing together thoughtful drapes for everyday elegance and life’s most treasured celebrations.
          </p>
        </div>

        <nav aria-label="Footer navigation">
          <h3 className="mb-6 text-sm font-bold uppercase tracking-[0.22em] text-[#E7C16C]">Explore</h3>
          <ul className="space-y-4 text-[15px] text-[#D8C9C2]">
            {exploreLinks.map((item) => (
              <li key={item.label}><button type="button" onClick={item.action} className="transition-colors hover:text-[#E7C16C]">{item.label}</button></li>
            ))}
            {categories.length > 0 && <li className="pt-1"><button type="button" onClick={() => onSelectCategory()} className="text-sm text-[#BDA9A0] transition-colors hover:text-[#E7C16C]">Browse all sarees</button></li>}
          </ul>
        </nav>

        <div>
          <h3 className="mb-6 text-sm font-bold uppercase tracking-[0.22em] text-[#E7C16C]">Stay Connected</h3>
          <div className="mb-7 flex gap-4">
            <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Instagram @sribhagyalakshmitextiles" className="flex h-14 w-14 items-center justify-center border border-[#8C5A28]/70 text-[#E7C16C] transition-colors hover:bg-[#E7C16C] hover:text-[#260006]"><Instagram size={24} /></a>
            <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" aria-label="YouTube Bhagya Lakshmi Ellampillai" className="flex h-14 w-14 items-center justify-center border border-[#8C5A28]/70 text-[#E7C16C] transition-colors hover:bg-[#E7C16C] hover:text-[#260006]"><Youtube size={24} /></a>
          </div>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="mb-5 block text-sm text-[#E7C16C] transition-colors hover:text-white">@sribhagyalakshmitextiles <span className="text-[#C6B1A8]">· Instagram</span></a>
          <a href={YOUTUBE_URL} target="_blank" rel="noreferrer" className="mb-6 block text-sm text-[#E7C16C] transition-colors hover:text-white">Bhagya Lakshmi Ellampillai <span className="text-[#C6B1A8]">· YouTube</span></a>
          <div className="space-y-3 text-sm text-[#D8C9C2]">
            <p className="flex items-center gap-2"><Phone size={15} className="shrink-0 text-[#E7C16C]" /><a href="tel:7358656601" className="hover:text-[#E7C16C]">7358656601</a></p>
            <p className="flex items-center gap-2"><Phone size={15} className="shrink-0 text-[#E7C16C]" /><a href="tel:8072951729" className="hover:text-[#E7C16C]">8072951729 <span className="text-[#BDA9A0]">(online orders)</span></a></p>
            <p className="flex items-center gap-2"><MapPin size={15} className="shrink-0 text-[#E7C16C]" />Elampillai, Salem, Tamil Nadu</p>
          </div>
        </div>
      </div>
      <div className="relative mx-auto mt-10 flex max-w-[1440px] flex-col gap-2 border-t border-[#6b351d]/60 px-6 pt-6 text-[11px] uppercase tracking-[0.13em] text-[#A78A82] sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
        <p>© {new Date().getFullYear()} Sri Bhagyalakshmi Textiles. All rights reserved.</p>
        <p>Woven with tradition · Elampillai</p>
      </div>
    </footer>
  );
};
