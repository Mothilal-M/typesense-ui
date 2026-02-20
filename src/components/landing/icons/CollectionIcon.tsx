export function CollectionIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="col-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      {/* Stack of database discs */}
      <ellipse cx="32" cy="18" rx="20" ry="8" fill="url(#col-grad)" fillOpacity="0.9" />
      <path d="M12 18v8c0 4.4 8.95 8 20 8s20-3.6 20-8v-8" fill="url(#col-grad)" fillOpacity="0.6" />
      <ellipse cx="32" cy="26" rx="20" ry="8" fill="none" stroke="url(#col-grad)" strokeWidth="0.5" strokeOpacity="0.5" />
      <path d="M12 26v8c0 4.4 8.95 8 20 8s20-3.6 20-8v-8" fill="url(#col-grad)" fillOpacity="0.4" />
      <ellipse cx="32" cy="34" rx="20" ry="8" fill="none" stroke="url(#col-grad)" strokeWidth="0.5" strokeOpacity="0.3" />
      <path d="M12 34v8c0 4.4 8.95 8 20 8s20-3.6 20-8v-8" fill="url(#col-grad)" fillOpacity="0.25" />
      <ellipse cx="32" cy="42" rx="20" ry="8" fill="none" stroke="url(#col-grad)" strokeWidth="1" strokeOpacity="0.4" />
      {/* Highlight dots */}
      <circle cx="22" cy="18" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="27" cy="18" r="1.5" fill="white" fillOpacity="0.6" />
      <circle cx="32" cy="18" r="1.5" fill="white" fillOpacity="0.6" />
    </svg>
  );
}
