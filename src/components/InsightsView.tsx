import React from 'react';
import { Sparkles, Utensils, ShieldCheck, Laptop, TrendingUp, ArrowRight, UploadCloud } from 'lucide-react';
import { InsightItem, PageId } from '../types';

interface InsightsViewProps {
  insights: InsightItem[];
  onNavigate: (page: PageId) => void;
  onOpenImportModal?: () => void;
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  insights,
  onNavigate,
  onOpenImportModal,
}) => {
  const getIcon = (tone: string) => {
    switch (tone) {
      case 'warning':
        return <Utensils className="w-5 h-5 text-[#A9822F]" />;
      case 'success':
        return <ShieldCheck className="w-5 h-5 text-[#2E7655]" />;
      case 'info':
        return <Laptop className="w-5 h-5 text-[#1C4E86]" />;
      default:
        return <TrendingUp className="w-5 h-5 text-[#064E49]" />;
    }
  };

  const getCardStyle = (tone: string) => {
    switch (tone) {
      case 'warning':
        return 'bg-gradient-to-br from-[#FCF8EE] to-[#FBF1D5] border-[#EFDDAB]';
      case 'success':
        return 'bg-gradient-to-br from-[#F5FAF0] to-[#E7F3E1] border-[#CFE0C4]';
      case 'info':
        return 'bg-gradient-to-br from-[#F4F8FC] to-[#E5F0F9] border-[#CDE1F3]';
      default:
        return 'bg-gradient-to-br from-[#FCF9F1] to-[#F5ECD9] border-[#E8DDC4]';
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-[#FBF6E9] border border-[#E8DDC4] shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="p-2.5 rounded-xl bg-[#D9B45B]/20 text-[#064E49]">
            <Sparkles className="w-5 h-5 text-[#A9822F]" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[#102C2B]">AI Financial Diagnostics</h2>
            <p className="text-xs text-[#68746D]">
              Automated pattern recognitions and spending elasticity observations detected across your actual uploaded account ledger.
            </p>
          </div>
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="p-10 rounded-3xl bg-[#FCF8EE] border border-[#E8DDC4] text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#D9B45B]/20 flex items-center justify-center text-[#064E49]">
            <Sparkles className="w-6 h-6 text-[#A9822F]" />
          </div>
          <h3 className="font-bold text-base text-[#102C2B]">
            Awaiting Real-Time Ledger Data
          </h3>
          <p className="text-xs text-[#68746D] max-w-md mx-auto leading-relaxed">
            Upload your real-time bank statement in the Transactions tab to automatically extract spending concentrations, reserve safety status, and cash flow elasticity.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('transactions')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#064E49] text-white text-xs sm:text-sm font-bold hover:bg-[#176B62] transition shadow-xs"
            >
              <UploadCloud className="w-4 h-4 text-[#F3D58A]" />
              <span>Go to Transactions & Upload</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-between space-y-4 transition hover:shadow-md ${getCardStyle(
                ins.tone
              )}`}
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-white/80 shadow-xs">
                    {getIcon(ins.tone)}
                  </span>
                  <h3 className="font-bold text-base text-[#102C2B]">{ins.title}</h3>
                </div>

                {/* Evidence box */}
                <div className="mt-3.5 p-3 rounded-2xl bg-white/70 border border-black/5 text-xs font-semibold text-[#102C2B]">
                  {ins.evidence}
                </div>

                {/* Explanation text */}
                <p className="text-xs text-[#68746D] mt-3 leading-relaxed">
                  {ins.explanation}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate(ins.page)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#064E49] text-white text-xs font-bold hover:bg-[#176B62] transition shadow-xs"
                >
                  <span>{ins.linkLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
