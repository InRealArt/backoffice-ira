'use client'

import { Accordion, AccordionItem } from './index'
import TranslationField from '../TranslationField'

export default function AccordionExample() {
  return (
    <form className="form-container">
      <div className="form-card">
        <div className="card-header">
          <h2 className="card-title">Exemple de formulaire avec Accordion</h2>
        </div>
        <div className="card-content">
          <Accordion>
            <AccordionItem title="Informations personnelles" defaultOpen={true}>
              <div className="d-flex gap-md">
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="firstName" className="form-label">Prénom</label>
                  <input
                    id="firstName"
                    type="text"
                    className="form-input"
                    placeholder="Votre prénom"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="lastName" className="form-label">Nom</label>
                  <input
                    id="lastName"
                    type="text"
                    className="form-input"
                    placeholder="Votre nom"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="votre@email.com"
                />
              </div>
            </AccordionItem>
            
            <AccordionItem title="Détails professionnels">
              <TranslationField
                entityType="Example"
                entityId="123"
                field="role"
                label="Rôle / Poste"
              >
                <input
                  id="role"
                  type="text"
                  className="form-input"
                  placeholder="Ex: CEO, CTO, Designer..."
                />
              </TranslationField>
              
              <div className="form-group">
                <label htmlFor="company" className="form-label">Entreprise</label>
                <input
                  id="company"
                  type="text"
                  className="form-input"
                  placeholder="Nom de l'entreprise"
                />
              </div>
            </AccordionItem>
            
            <AccordionItem title="Liens sociaux">
              <div className="d-flex gap-md">
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="linkedinUrl" className="form-label">LinkedIn</label>
                  <input
                    id="linkedinUrl"
                    type="text"
                    className="form-input"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="websiteUrl" className="form-label">Site web</label>
                  <input
                    id="websiteUrl"
                    type="text"
                    className="form-input"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </AccordionItem>
          </Accordion>
          
          <div className="form-actions" style={{ marginTop: '16px' }}>
            <button type="button" className="secondary-button">
              Annuler
            </button>
            <button type="submit" className="btn btn-primary btn-medium">
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </form>
  )
} 