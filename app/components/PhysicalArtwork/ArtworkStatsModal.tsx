"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  getMonthlyViewStats,
  getPhysicalItemIdByItemId,
} from "@/lib/actions/items-actions";
import Modal from "@/app/components/Common/Modal";

interface ArtworkStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: number;
  artworkName: string;
}

export default function ArtworkStatsModal({
  isOpen,
  onClose,
  itemId,
  artworkName,
}: ArtworkStatsModalProps) {
  const [stats, setStats] = useState<
    Array<{
      year: number;
      month: number;
      viewCount: number;
      monthLabel: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && itemId) {
      loadStats();
    } else if (!isOpen) {
      // Réinitialiser les stats quand la modale se ferme
      setStats([]);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, itemId]);

  async function loadStats() {
    setIsLoading(true);
    setError(null);

    try {
      // Récupérer le physicalItemId depuis l'itemId
      const physicalItemId = await getPhysicalItemIdByItemId(itemId);

      if (!physicalItemId) {
        setError("Aucune œuvre physique trouvée pour cet item");
        setIsLoading(false);
        return;
      }

      // Récupérer les stats mensuelles
      const monthlyStats = await getMonthlyViewStats(physicalItemId);
      setStats(monthlyStats);
    } catch (err) {
      console.error("Erreur lors du chargement des stats:", err);
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setIsLoading(false);
    }
  }

  // Inverser l'ordre pour afficher du plus ancien au plus récent
  const chartData = [...stats].reverse();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Statistiques de vues - ${artworkName}`}
      maxWidth="max-w-4xl"
    >
      <div className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Chargement des statistiques...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-red-500">{error}</div>
          </div>
        ) : stats.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">
              Aucune statistique disponible pour cette œuvre
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Vues mensuelles
              </h3>
              <p className="text-sm text-gray-600">
                Nombre total de vues :{" "}
                <span className="font-semibold">
                  {stats
                    .reduce((sum, stat) => sum + stat.viewCount, 0)
                    .toLocaleString("fr-FR")}
                </span>
              </p>
            </div>

            <div className="w-full" style={{ height: "400px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="monthLabel"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis
                    label={{
                      value: "Nombre de vues",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                    formatter={(value: number) => [
                      value.toLocaleString("fr-FR"),
                      "Vues",
                    ]}
                    labelFormatter={(label) => `Période : ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="viewCount"
                    name="Vues"
                    fill="#6366f1"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {stats.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Détails par mois
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {stats.map((stat) => (
                    <div
                      key={`${stat.year}-${stat.month}`}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="text-xs text-gray-600 mb-1">
                        {stat.monthLabel}
                      </div>
                      <div className="text-lg font-semibold text-indigo-600">
                        {stat.viewCount.toLocaleString("fr-FR")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
