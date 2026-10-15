"use client";

import { useState } from "react";
import Link from "@/lib/router/link";
import Image from "@/lib/router/image";
import { ArrowUpRight, AudioLines, BookOpen, MapPin, Plus } from "lucide-react";
import { AudioPlayer } from "@/components/audio/audio-player";
import { editorialPhotoUrl } from "@/lib/media/editorial-photos";

export function HeroVignette() {
  const [mode, setMode] = useState<"story" | "voice">("story");
  return (
    <div className="la-archive-object">
      <div className="la-object-back" aria-hidden />
      <div className="la-archive-cover">
        <div className="la-archive-top"><span><BookOpen size={14} /> THE ELLIS FAMILY ARCHIVE</span><span>VOL. 01</span></div>
        <div className="la-archive-photo"><Image src={editorialPhotoUrl("maine-family-1972")} alt="A family sharing time together on the Maine coast" fill priority sizes="(max-width: 760px) 90vw, 46vw" /><span><MapPin size={12} /> Maine, summer 1972</span></div>
        <div className="la-archive-title"><div><span>THE LIFE & STORIES OF</span><h2>Margaret Ellis</h2></div><Link href="/view/cap_margaret" aria-label="Explore Margaret’s sample archive"><ArrowUpRight size={25} strokeWidth={1.3} /></Link></div>
      </div>
      <div className="la-memory-slip">
        <div className="la-slip-top"><span className="la-mini-dot" /> A MOMENT, KEPT<div role="group" aria-label="Memory preview mode"><button aria-pressed={mode === "story"} onClick={() => setMode("story")} aria-label="Read the story"><BookOpen size={15} /></button><button aria-pressed={mode === "voice"} onClick={() => setMode("voice")} aria-label="Listen to sample narration"><AudioLines size={15} /></button></div></div>
        {mode === "story" ? <><h3>“We stayed until<br />the light turned gold.”</h3><p>One summer. A little red bucket.<br />The kind of day you keep forever.</p><Link href="/view/cap_margaret/stories/mem_summer" className="la-slip-link">Open this memory <ArrowUpRight size={14} /></Link></> : <div className="la-slip-audio"><h3>The summer we<br />forgot the time.</h3><AudioPlayer mediaId="aud_summer" variant="mini" title="The summer we forgot the time" showNotice={false} /><p>Synthesized narration of a fictional story.</p></div>}
      </div>
      <div className="la-archive-index"><span>1940</span><i /><span>1965</span><i className="active" /><span>1972</span><i /><span>Today</span><Link href="/app/capsules/new" aria-label="Add your own family story"><Plus size={15} /></Link></div>
      <p className="la-art-disclosure">An imagined family. A real way to keep your own story.</p>
    </div>
  );
}
