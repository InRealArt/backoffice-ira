import styles from './IpfsUriField.module.scss'

export default function IpfsUriField({ label, uri, prefix = 'ipfs://' }: { label: string, uri: string, prefix?: string } ) {
    return (
      <div className={styles.formGroup}>
        <label>{label}</label>
        <div className={styles.ipfsLinkContainer}>
          <input
            type="text"
            value={`${prefix}${uri}`}
            readOnly
            className={styles.formInput}
          />
          <a 
            href={`https://gateway.pinata.cloud/ipfs/${uri}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.viewLink}
          >
            Voir
          </a>
        </div>
      </div>
    )
  }
