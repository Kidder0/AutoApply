// UI Component: One-Click Apply Button
// Shows job match score and apply button

import React, { useState } from 'react';
import { Zap, CheckCircle, AlertCircle, AlertTriangle, Loader } from 'lucide-react';

interface OneClickApplyProps {
  job: {
    id: string;
    title: string;
    company: string;
    description: string;
  };
  profile: {
    name: string;
    email: string;
    phone?: string;
    skills: string[];
    experience: Array<{ title: string; company: string; duration: string }>;
  };
  resume: string;
  onApplySuccess?: (result: any) => void;
}

export const OneClickApplyButton: React.FC<OneClickApplyProps> = ({
  job,
  profile,
  resume,
  onApplySuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleApply = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/applications/apply-one-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job,
          profile,
          resume,
        }),
      });

      if (!response.ok) {
        throw new Error('Application submission failed');
      }

      const data = await response.json();
      setSuccess(data);
      onApplySuccess?.(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 border-2 border-green-200 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-green-900">Application Submitted!</h3>
            <p className="text-green-800 text-sm mt-1">
              Your application to {job.company} for {job.title} has been submitted successfully.
            </p>
            <div className="mt-3 space-y-1 text-sm text-green-700">
              {success.nextSteps.map((step: string, i: number) => (
                <p key={i}>✓ {step}</p>
              ))}
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
            >
              Apply to Another Job
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Match Score Card */}
      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-blue-900">Resume Match</span>
          {success?.match?.readiness === 'ready' && (
            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-bold">
              Ready
            </span>
          )}
          {success?.match?.readiness === 'review' && (
            <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full font-bold">
              Review First
            </span>
          )}
        </div>

        {/* Score Bar */}
        <div className="mb-2">
          <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
              style={{ width: `${success?.match?.score || 0}%` }}
            />
          </div>
          <div className="text-right text-xs font-bold text-blue-900 mt-1">
            {success?.match?.score || '?'}% Match
          </div>
        </div>

        {/* Match Details */}
        {success?.match && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-700 hover:text-blue-900 underline"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        )}

        {showDetails && success?.match && (
          <div className="mt-2 text-xs space-y-2 border-t border-blue-200 pt-2">
            <div>
              <span className="font-semibold text-green-700">✓ Matched Skills:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {success.match.matchedSkills.map((skill: string) => (
                  <span
                    key={skill}
                    className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {success.match.missingSkills.length > 0 && (
              <div>
                <span className="font-semibold text-amber-700">📚 Missing Skills:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {success.match.missingSkills.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {success.match.suggestions.map((suggestion: string, i: number) => (
              <p key={i} className="text-gray-700 italic">
                {suggestion}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Apply Button */}
      {!success && (
        <button
          onClick={handleApply}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
            loading
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white hover:shadow-lg'
          }`}
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Applying...
            </>
          ) : success?.match?.readiness === 'ready' ? (
            <>
              <Zap className="w-5 h-5" />
              Apply Now
            </>
          ) : success?.match?.readiness === 'review' ? (
            <>
              <AlertCircle className="w-5 h-5" />
              Review & Apply
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5" />
              Apply Anyway
            </>
          )}
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 border-2 border-red-200 p-3">
          <p className="text-sm text-red-700">
            <span className="font-bold">Error:</span> {error}
          </p>
        </div>
      )}

      {/* Info Message */}
      {!success && success?.match?.readiness !== 'ready' && (
        <div className="rounded-lg bg-amber-50 border-2 border-amber-200 p-3">
          <p className="text-xs text-amber-800">
            <span className="font-semibold">💡 Tip:</span> Your application will be reviewed along with all others.
            Strong matches have better chances of moving forward.
          </p>
        </div>
      )}
    </div>
  );
};

export default OneClickApplyButton;
