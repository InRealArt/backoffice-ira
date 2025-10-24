'use client'

import { FormData } from './htmlGenerator'

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
    <div className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-xl font-sans">
      <div className="flex items-center gap-6 mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center flex-col relative font-bold shadow-lg ${
          getScoreColor(percentage) === 'excellent' ? 'bg-gradient-to-br from-green-500 to-green-600 text-white' :
          getScoreColor(percentage) === 'good' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' :
          getScoreColor(percentage) === 'average' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white' :
          'bg-gradient-to-br from-red-500 to-red-600 text-white'
        }`}>
          <span className="text-3xl leading-none">{percentage}</span>
          <span className="text-sm opacity-80">%</span>
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 m-0 mb-2">Score SEO Global</h3>
          <p className={`text-lg font-semibold m-0 mb-1 ${
            getScoreColor(percentage) === 'excellent' ? 'text-green-600' :
            getScoreColor(percentage) === 'good' ? 'text-blue-600' :
            getScoreColor(percentage) === 'average' ? 'text-yellow-600' :
            'text-red-600'
          }`}>{getScoreLabel(percentage)}</p>
          <p className="text-sm text-gray-500 m-0">{totalScore}/{maxTotalScore} points</p>
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-xl font-bold text-gray-900 m-0 mb-4">Analyse détaillée</h4>
        {criteria.map((criterion, index) => (
          <div key={index} className={`bg-white rounded-xl p-5 mb-3 border-l-4 shadow-sm border border-gray-200 transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-md ${
            criterion.status === 'success' ? 'border-l-green-500 bg-gradient-to-r from-white to-green-50' :
            criterion.status === 'warning' ? 'border-l-yellow-500 bg-gradient-to-r from-white to-yellow-50' :
            'border-l-red-500 bg-gradient-to-r from-white to-red-50'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3 font-semibold text-gray-900 text-base">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  criterion.status === 'success' ? 'bg-green-500 text-white' :
                  criterion.status === 'warning' ? 'bg-yellow-500 text-white' :
                  'bg-red-500 text-white'
                }`}>
                  {criterion.status === 'success' ? '✓' : criterion.status === 'warning' ? '⚠' : '✗'}
                </span>
                {criterion.name}
              </div>
              <div className="font-bold text-sm bg-gray-100 px-3 py-1.5 rounded-full text-gray-700">
                {criterion.score}/{criterion.maxScore}
              </div>
            </div>
            <p className="text-gray-600 text-sm m-0 leading-relaxed">{criterion.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h4 className="text-lg font-bold text-gray-900 m-0 mb-4 flex items-center gap-2">
          <span className="text-xl">💡</span>
          Recommandations
        </h4>
        <ul className="list-none p-0 m-0">
          {criteria
            .filter(criterion => criterion.score < criterion.maxScore)
            .map((criterion, index) => (
              <li key={index} className="p-3 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg mb-2 text-yellow-800 text-sm font-medium border-l-3 border-yellow-500 last:mb-0">
                Améliorer : {criterion.name} - {criterion.description}
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
} 