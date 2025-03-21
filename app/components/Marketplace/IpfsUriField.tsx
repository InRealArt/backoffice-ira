export default function IpfsUriField({ label, uri, prefix = 'ipfs://' }: { label: string, uri: string, prefix?: string } ) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <div className="d-flex">
        <input
          type="text"
          value={`${prefix}${uri}`}
          readOnly
          className="form-input flex-grow-1"
        />
        <a 
          href={`https://gateway.pinata.cloud/ipfs/${uri}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-secondary ms-sm"
        >
          Voir
        </a>
      </div>
    </div>
  )
}
