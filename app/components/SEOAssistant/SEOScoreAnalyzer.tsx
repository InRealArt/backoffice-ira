'use client'

import { FormData } from './htmlGenerator'
import styles from './SEOScoreAnalyzer.module.scss'

interface SEOCriterion {
  name: string
  description: string
  score: number
  maxScore: number
  status: 'success' | 'warning' | 'error'
}

interface SEOScoreAnalyzerProps {
  formData: FormData
}

export default function SEOScoreAnalyzer({ formData }: SEOScoreAnalyzerProps) {
  const analyzeSEO = (): SEOCriterion[] => {
    const criteria: SEOCriterion[] = []

    // Analyse du titre
    const titleLength = formData.title?.length || 0
    criteria.push({
      name: 'Titre H1',
      description: 'Le titre doit faire entre 30 et 60 caractères',
      score: titleLength >= 30 && titleLength <= 60 ? 10 : titleLength > 0 ? 5 : 0,
      maxScore: 10,
      status: titleLength >= 30 && titleLength <= 60 ? 'success' : titleLength > 0 ? 'warning' : 'error'
    })

    // Analyse de la meta description
    const metaLength = formData.metaDescription?.length || 0
    criteria.push({
      name: 'Meta Description',
      description: 'La meta description doit faire entre 150 et 160 caractères',
      score: metaLength >= 150 && metaLength <= 160 ? 10 : metaLength > 0 ? 5 : 0,
      maxScore: 10,
      status: metaLength >= 150 && metaLength <= 160 ? 'success' : metaLength > 0 ? 'warning' : 'error'
    })

    // Analyse du contenu
    const contentLength = formData.content?.length || 0
    criteria.push({
      name: 'Longueur du contenu',
      description: 'Le contenu doit faire au moins 300 mots',
      score: contentLength >= 1500 ? 10 : contentLength >= 300 ? 7 : contentLength > 0 ? 3 : 0,
      maxScore: 10,
      status: contentLength >= 1500 ? 'success' : contentLength >= 300 ? 'warning' : 'error'
    })

    // Analyse des mots-clés
    const hasKeyword = formData.metaKeywords && formData.title?.toLowerCase().includes(formData.metaKeywords.toLowerCase())
    criteria.push({
      name: 'Mot-clé dans le titre',
      description: 'Le mot-clé principal doit apparaître dans le titre',
      score: hasKeyword ? 10 : 0,
      maxScore: 10,
      status: hasKeyword ? 'success' : 'error'
    })

    // Analyse de l'URL
    const urlLength = formData.slug?.length || 0
    const urlScore = urlLength > 0 && urlLength <= 60 ? 10 : urlLength > 0 ? 5 : 0
    criteria.push({
      name: 'URL optimisée',
      description: 'L\'URL doit être courte et descriptive (max 60 caractères)',
      score: urlScore,
      maxScore: 10,
      status: urlLength > 0 && urlLength <= 60 ? 'success' : urlLength > 0 ? 'warning' : 'error'
    })

    // Analyse des images
    const hasImage = formData.mainImageUrl ? true : false
    criteria.push({
      name: 'Image mise en avant',
      description: 'Une image mise en avant améliore l\'engagement',
      score: hasImage ? 10 : 0,
      maxScore: 10,
      status: hasImage ? 'success' : 'warning'
    })

    return criteria
  }

  const criteria = analyzeSEO()
  const totalScore = criteria.reduce((sum, criterion) => sum + criterion.score, 0)
  const maxTotalScore = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0)
  const percentage = Math.round((totalScore / maxTotalScore) * 100)

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'excellent'
    if (percentage >= 60) return 'good'
    if (percentage >= 40) return 'average'
    return 'poor'
  }

  const getScoreLabel = (percentage: number) => {
    if (percentage >= 80) return 'Excellent'
    if (percentage >= 60) return 'Bon'
    if (percentage >= 40) return 'Moyen'
    return 'À améliorer'
  }

  return (
    <div className={styles.container}>
      <div className={styles.scoreHeader}>
        <div className={`${styles.scoreCircle} ${styles[getScoreColor(percentage)]}`}>
          <span className={styles.scoreNumber}>{percentage}</span>
          <span className={styles.scorePercent}>%</span>
        </div>
        <div className={styles.scoreInfo}>
          <h3 className={styles.scoreTitle}>Score SEO Global</h3>
          <p className={styles.scoreLabel}>{getScoreLabel(percentage)}</p>
          <p className={styles.scoreDetails}>{totalScore}/{maxTotalScore} points</p>
        </div>
      </div>

      <div className={styles.criteriaList}>
        <h4 className={styles.criteriaTitle}>Analyse détaillée</h4>
        {criteria.map((criterion, index) => (
          <div key={index} className={`${styles.criterion} ${styles[criterion.status]}`}>
            <div className={styles.criterionHeader}>
              <div className={styles.criterionName}>
                <span className={`${styles.statusIcon} ${styles[criterion.status]}`}>
                  {criterion.status === 'success' ? '✓' : criterion.status === 'warning' ? '⚠' : '✗'}
                </span>
                {criterion.name}
              </div>
              <div className={styles.criterionScore}>
                {criterion.score}/{criterion.maxScore}
              </div>
            </div>
            <p className={styles.criterionDescription}>{criterion.description}</p>
          </div>
        ))}
      </div>

      <div className={styles.recommendations}>
        <h4 className={styles.recommendationsTitle}>Recommandations</h4>
        <ul className={styles.recommendationsList}>
          {criteria
            .filter(criterion => criterion.score < criterion.maxScore)
            .map((criterion, index) => (
              <li key={index} className={styles.recommendation}>
                Améliorer : {criterion.name} - {criterion.description}
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
} 