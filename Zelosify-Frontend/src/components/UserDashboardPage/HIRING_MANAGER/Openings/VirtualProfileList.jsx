"use client";
import { useState } from "react";
import ProfileCard from "./ProfileCard";

const ROW_HEIGHT = 280;
const VIEWPORT_HEIGHT = 900;
const OVERSCAN = 3;
const VIRTUALIZATION_THRESHOLD = 50;

export default function VirtualProfileList({
  profiles,
  pendingProfileId,
  onShortlist,
  onReject,
  onPreview,
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const renderCard = (profile) => (
    <ProfileCard
      key={profile.id}
      profile={profile}
      isPending={pendingProfileId === profile.id}
      onShortlist={onShortlist}
      onReject={onReject}
      onPreview={onPreview}
    />
  );

  if (profiles.length <= VIRTUALIZATION_THRESHOLD) {
    return <div className="space-y-4">{profiles.map(renderCard)}</div>;
  }

  const visibleCount = Math.ceil(VIEWPORT_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(profiles.length, startIndex + visibleCount);
  const visibleProfiles = profiles.slice(startIndex, endIndex);

  return (
    <div
      className="overflow-y-auto"
      style={{ height: VIEWPORT_HEIGHT }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div style={{ height: profiles.length * ROW_HEIGHT, position: "relative" }}>
        <div
          className="space-y-4"
          style={{
            position: "absolute",
            top: startIndex * ROW_HEIGHT,
            left: 0,
            right: 0,
          }}
        >
          {visibleProfiles.map(renderCard)}
        </div>
      </div>
    </div>
  );
}
