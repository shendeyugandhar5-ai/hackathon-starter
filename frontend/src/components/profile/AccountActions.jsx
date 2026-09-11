import React, { useState } from 'react';
import { ShieldCheck, KeyRound, LogOut, CheckCircle2, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function AccountActions({ onSignOut }) {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ success: null, message: null });

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setPasswordStatus({ success: null, message: null });

    if (newPassword.length < 6) {
      setPasswordStatus({
        success: false,
        message: 'Password must be at least 6 characters in length.'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        success: false,
        message: 'Passwords do not match. Please verify and try again.'
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (error) throw error;

        setPasswordStatus({
          success: true,
          message: 'Password updated securely via Supabase Auth.'
        });
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowPasswordForm(false), 3000);
      } else {
        // Local mode
        setPasswordStatus({
          success: true,
          message: 'Password updated successfully for local development.'
        });
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setShowPasswordForm(false), 3000);
      }
    } catch (err) {
      setPasswordStatus({
        success: false,
        message: err.message || 'Failed to update password. Please try again.'
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#EAE5DC] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
        <div>
          <h2 className="font-serif text-lg font-normal text-[#1C1917]">
            Account Security
          </h2>
          <p className="text-xs text-[#57534E] mt-0.5">
            Authentication and credential security are governed directly by Supabase Auth.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#2E7D52] px-2 py-0.5 rounded bg-[#EAF4EE] border border-[#CDE5D5] font-semibold">
          <ShieldCheck className="w-3 h-3" /> SECURED
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-[#1C1917]">
            Password & Access Control
          </div>
          <div className="text-[11px] text-[#78716C] max-w-md">
            Passwords are never stored in the application database. All credential operations use encrypted cryptographic hashing.
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setShowPasswordForm(!showPasswordForm);
              setPasswordStatus({ success: null, message: null });
            }}
            className="px-3.5 py-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F2ECE0] border border-[#EAE5DC] text-xs font-semibold text-[#1C1917] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#A8421E]" />
            <span>{showPasswordForm ? 'Cancel Password Change' : 'Change Password'}</span>
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="px-3.5 py-2 rounded-lg bg-[#FDF0ED] hover:bg-[#FBE5E0] border border-[#F7CFC2] text-xs font-semibold text-[#B93826] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#B93826]" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Expandable Change Password Panel */}
      {showPasswordForm && (
        <form
          onSubmit={handlePasswordUpdate}
          className="mt-4 p-4 rounded-xl bg-[#FAF7F2] border border-[#EAE5DC] space-y-3.5 transition-all"
        >
          <div className="text-xs font-semibold text-[#1C1917] flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#A8421E]" />
            <span>Set New Supabase Auth Password</span>
          </div>

          {passwordStatus.message && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                passwordStatus.success
                  ? 'bg-[#EAF4EE] border-[#CDE5D5] text-[#2E7D52]'
                  : 'bg-[#FDF0ED] border-[#F7CFC2] text-[#B93826]'
              }`}
            >
              {passwordStatus.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2E7D52]" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#B93826]" />
              )}
              <span>{passwordStatus.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label 
                htmlFor="new-password-input"
                className="block text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-semibold mb-1"
              >
                NEW PASSWORD
              </label>
              <div className="relative">
                <input
                  id="new-password-input"
                  type={showPasswordText ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2 bg-white border border-[#EAE5DC] rounded-lg text-xs font-mono text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#A8421E]"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="absolute right-2.5 top-2.5 text-[#8C827A] hover:text-[#1C1917]"
                >
                  {showPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label 
                htmlFor="confirm-new-password-input"
                className="block text-[10px] font-mono uppercase tracking-wider text-[#78716C] font-semibold mb-1"
              >
                CONFIRM NEW PASSWORD
              </label>
              <input
                id="confirm-new-password-input"
                type={showPasswordText ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3 py-2 bg-white border border-[#EAE5DC] rounded-lg text-xs font-mono text-[#1C1917] focus:outline-none focus:ring-1 focus:ring-[#A8421E]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowPasswordForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs text-[#57534E] hover:bg-[#EAE5DC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="px-4 py-1.5 rounded-lg bg-[#A8421E] hover:bg-[#8E3516] disabled:opacity-60 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
