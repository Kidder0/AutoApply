import React, { useState } from "react";
import { UserProfile, PreferenceWeights } from "../types";
import { Plus, Trash2, Sliders, Briefcase, GraduationCap, Link2, BookOpen, User, Percent } from "lucide-react";

interface ProfileTabProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  weights: PreferenceWeights;
  setWeights: React.Dispatch<React.SetStateAction<PreferenceWeights>>;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ profile, setProfile, weights, setWeights }) => {
  const [newSkill, setNewSkill] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const updateProfileField = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleWeightChange = (key: keyof PreferenceWeights, value: number) => {
    setWeights(prev => ({ ...prev, [key]: value }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      updateProfileField("skills", [...profile.skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    updateProfileField("skills", profile.skills.filter(s => s !== skill));
  };

  const handleAddTitle = () => {
    if (newTitle.trim() && !profile.desiredTitles.includes(newTitle.trim())) {
      updateProfileField("desiredTitles", [...profile.desiredTitles, newTitle.trim()]);
      setNewTitle("");
    }
  };

  const handleRemoveTitle = (title: string) => {
    updateProfileField("desiredTitles", profile.desiredTitles.filter(t => t !== title));
  };

  const handleAddLocation = () => {
    if (newLocation.trim() && !profile.targetLocations.includes(newLocation.trim())) {
      updateProfileField("targetLocations", [...profile.targetLocations, newLocation.trim()]);
      setNewLocation("");
    }
  };

  const handleRemoveLocation = (location: string) => {
    updateProfileField("targetLocations", profile.targetLocations.filter(l => l !== location));
  };

  const totalWeight = weights.titleWeight + weights.skillsWeight + weights.locationWeight + weights.salaryWeight + weights.visaWeight + weights.companyWeight;

  return (
    <div className="space-y-8" id="profile-workspace">
      {/* Dynamic Score Weights Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-5 h-5 text-indigo-650" />
          <h2 className="text-xl font-bold text-slate-800 font-sans">Dynamic Match & Preference Weighting</h2>
        </div>
        <p className="text-sm text-slate-505 mb-6 leading-relaxed">
          Optimize your score matching by indicating which factors are critical to your career goals. 
          Current absolute weighting sum: <span className="text-indigo-600 font-mono font-bold">{totalWeight}%</span>.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-600 mb-1 font-bold">
                <span>Job Title Match</span>
                <span>{weights.titleWeight}%</span>
              </div>
              <input
                type="range" min="0" max="50" step="5"
                value={weights.titleWeight}
                onChange={e => handleWeightChange("titleWeight", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-600 mb-1 font-bold">
                <span>Required Skills Alignment</span>
                <span>{weights.skillsWeight}%</span>
              </div>
              <input
                type="range" min="0" max="50" step="5"
                value={weights.skillsWeight}
                onChange={e => handleWeightChange("skillsWeight", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-600 mb-1 font-bold">
                <span>Geographic Location / Work Type</span>
                <span>{weights.locationWeight}%</span>
              </div>
              <input
                type="range" min="0" max="50" step="5"
                value={weights.locationWeight}
                onChange={e => handleWeightChange("locationWeight", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-600 mb-1 font-bold">
                <span>Expected Salary Threshold</span>
                <span>{weights.salaryWeight}%</span>
              </div>
              <input
                type="range" min="0" max="50" step="5"
                value={weights.salaryWeight}
                onChange={e => handleWeightChange("salaryWeight", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-600 mb-1 font-bold">
                <span>Visa Sponsorship Feasibility</span>
                <span>{weights.visaWeight}%</span>
              </div>
              <input
                type="range" min="0" max="50" step="5"
                value={weights.visaWeight}
                onChange={e => handleWeightChange("visaWeight", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-600 mb-1 font-bold">
                <span>Preferred vs Excluded Companies</span>
                <span>{weights.companyWeight}%</span>
              </div>
              <input
                type="range" min="0" max="50" step="5"
                value={weights.companyWeight}
                onChange={e => handleWeightChange("companyWeight", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Personal Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <User className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-505 mb-1 font-bold">FULL NAME</label>
                <input
                  type="text"
                  value={profile.fullName}
                  onChange={e => updateProfileField("fullName", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-805 focus:outline-none focus:border-indigo-600 font-sans shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-505 mb-1 font-bold">EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => updateProfileField("email", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-805 focus:outline-none focus:border-indigo-600 font-sans shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-505 mb-1 font-bold">PHONE NUMBER</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={e => updateProfileField("phone", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-805 focus:outline-none focus:border-indigo-600 font-sans shadow-inner"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-505 mb-1 font-bold">CURRENT LOCATION</label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={e => updateProfileField("location", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-850 focus:outline-none focus:border-indigo-600 font-sans shadow-inner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-slate-505 mb-1 font-bold">WORK AUTHORIZATION</label>
                <input
                  type="text"
                  value={profile.workAuthorization}
                  onChange={e => updateProfileField("workAuthorization", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-850 focus:outline-none focus:border-indigo-600 font-sans shadow-inner"
                />
              </div>

              <div className="flex items-center gap-2 h-full pt-6">
                <input
                  type="checkbox"
                  id="requiresSponsorship"
                  checked={profile.requiresSponsorship}
                  onChange={e => updateProfileField("requiresSponsorship", e.target.checked)}
                  className="w-4 h-4 rounded bg-white border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="requiresSponsorship" className="text-sm text-slate-650 font-sans cursor-pointer font-bold select-none">
                  Requires Visa Sponsorship
                </label>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-505 mb-1 font-bold">EXPERIENCE LEVEL</label>
                <select
                  value={profile.experienceLevel}
                  onChange={e => updateProfileField("experienceLevel", e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-sm text-slate-850 focus:outline-none focus:border-indigo-600 font-sans"
                >
                  <option value="Entry">Entry Level</option>
                  <option value="Mid">Mid Level</option>
                  <option value="Senior">Senior Level</option>
                  <option value="Lead">Lead Engineer</option>
                  <option value="Executive">Executive / Director</option>
                </select>
              </div>
            </div>
          </div>

          {/* Work Experience */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-800">Work Experience</h3>
            </div>

            {profile.experience.map((exp, index) => (
              <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 relative">
                <button
                  onClick={() => {
                    const newExp = [...profile.experience];
                    newExp.splice(index, 1);
                    updateProfileField("experience", newExp);
                  }}
                  className="absolute top-4 right-4 p-1 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="font-bold text-slate-800 font-sans text-sm">{exp.title}</div>
                <div className="text-xs font-mono text-indigo-700 font-bold">{exp.company} — {exp.location} ({exp.duration})</div>
                <p className="text-xs text-slate-650 whitespace-pre-line leading-relaxed mt-1 font-sans">{exp.description}</p>
              </div>
            ))}
          </div>

          {/* Screening Question Answer Bank */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-800">AI Application Answer Bank (Screening)</h3>
            </div>
            <p className="text-xs text-slate-500">
              These pre-answered templates are analyzed by the AI Layer to construct authentic responses for screening questions.
            </p>

            {profile.answerBank.map((item, index) => (
              <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5 font-bold uppercase tracking-wider">{item.category}</span>
                  <button
                    onClick={() => {
                      const newBank = [...profile.answerBank];
                      newBank.splice(index, 1);
                      updateProfileField("answerBank", newBank);
                    }}
                    className="p-1 hover:text-rose-600 text-slate-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs font-bold text-slate-700 font-sans">Q: {item.question}</div>
                <div className="text-xs text-slate-650 mt-1 pl-4 border-l-2 border-indigo-250/50 leading-relaxed font-sans">A: {item.answer}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Side Panel: Job Preferences Targets */}
        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">Job Targets & Specs</h3>

            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1 font-bold">DESIRED ROLES</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Staff React Dev"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddTitle()}
                  className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-650"
                />
                <button
                  onClick={handleAddTitle}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {profile.desiredTitles.map(t => (
                  <span key={t} className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-705 border border-slate-205 rounded px-2 py-0.5 text-xs font-sans shadow-xs font-bold font-sans">
                    {t}
                    <button onClick={() => handleRemoveTitle(t)} className="text-slate-400 hover:text-rose-600 text-xs font-bold ml-1 font-sans">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1 font-bold">TARGET LOCATIONS</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Remote"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddLocation()}
                  className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-650"
                />
                <button
                  onClick={handleAddLocation}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {profile.targetLocations.map(l => (
                  <span key={l} className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-705 border border-slate-200 rounded px-2 py-0.5 text-xs font-sans shadow-xs font-bold font-sans">
                    {l}
                    <button onClick={() => handleRemoveLocation(l)} className="text-slate-400 hover:text-rose-600 text-xs font-bold ml-1">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-500 mb-1 font-bold">WORK RANGE MIN (USD/yr)</label>
              <input
                type="number"
                value={profile.salaryMin}
                step="5000"
                onChange={e => updateProfileField("salaryMin", parseInt(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 shadow-inner"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-500 mb-2 font-bold">WORK CONTEXT PREFERENCE</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(["Remote", "Hybrid", "On-site", "Any"] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => updateProfileField("workTypePreference", option)}
                    className={`px-3 py-1.5 border rounded transition-all cursor-pointer font-bold ${
                      profile.workTypePreference === option
                        ? "bg-indigo-600 border-indigo-650 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-505 hover:bg-slate-50 hover:border-slate-350"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Practical Skills Bag */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">Expertise & Skills</h3>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add technology/skill..."
                value={newSkill}
                onChange={e => setNewSkill(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-indigo-650"
              />
              <button
                onClick={handleAddSkill}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded p-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map(skill => (
                <span key={skill} className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded px-2.5 py-0.5 text-xs font-mono font-bold shadow-xs">
                  {skill}
                  <button onClick={() => handleRemoveSkill(skill)} className="text-indigo-400 hover:text-rose-600 font-bold ml-1">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Blocklists and Preferences */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-rose-650 uppercase tracking-wider font-mono">Compliance & Guardrails</h3>
            
            <div>
              <label className="block text-xs font-mono text-rose-600 mb-1 font-bold">EXCLUDED COMPANIES</label>
              <p className="text-[10px] text-slate-450 mb-2 font-medium leading-relaxed">Applications to these companies will be immediately blocked and scrubbed.</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.excludedCompanies.map(company => (
                  <span key={company} className="inline-flex items-center gap-1 bg-rose-50 text-rose-705 border border-rose-100 rounded px-2.5 py-0.5 text-xs font-sans font-bold shadow-xs">
                    {company}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-emerald-700 mb-1 font-bold">PREFERRED TARGETS</label>
              <div className="flex flex-wrap gap-1.5">
                {profile.preferredCompanies.map(company => (
                  <span key={company} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-705 border border-emerald-100 rounded px-2.5 py-0.5 text-xs font-sans font-bold shadow-xs">
                    {company}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
