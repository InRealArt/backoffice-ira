export default function IpfsUriField({ label, uri, prefix = 'ipfs://' }: { label: string, uri: string, prefix?: string }) {
  return (
    <div className="form-group ipfs-field-container">
      {label && <label className="form-label">{label}</label>}
      <div className="ipfs-field-group">
        <input
          type="text"
          value={`${prefix}${uri}`}
          readOnly
          className="ipfs-field-input"
        />
        <a 
          href={`https://gateway.pinata.cloud/ipfs/${uri}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="ipfs-field-button"
          aria-label="Voir sur IPFS"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3C7.032 3 3 7.032 3 12C3 16.968 7.032 21 12 21C16.968 21 21 16.968 21 12C21 7.032 16.968 3 12 3ZM12 19.5C7.86 19.5 4.5 16.14 4.5 12C4.5 7.86 7.86 4.5 12 4.5C16.14 4.5 19.5 7.86 19.5 12C19.5 16.14 16.14 19.5 12 19.5Z" fill="currentColor"/>
            <path d="M12.75 16.5V12C12.75 11.586 12.414 11.25 12 11.25C11.586 11.25 11.25 11.586 11.25 12V16.5C11.25 16.914 11.586 17.25 12 17.25C12.414 17.25 12.75 16.914 12.75 16.5Z" fill="currentColor"/>
            <path d="M13.5 8.25C13.5 8.664 13.164 9 12.75 9H11.25C10.836 9 10.5 8.664 10.5 8.25C10.5 7.836 10.836 7.5 11.25 7.5H12.75C13.164 7.5 13.5 7.836 13.5 8.25Z" fill="currentColor"/>
          </svg>
          Voir
        </a>
      </div>
    </div>
  );
}
