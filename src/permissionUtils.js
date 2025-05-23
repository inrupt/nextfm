import { useState } from 'react';
import { Plus, X, Info } from 'lucide-react';

const AccessRow = ({ label, access }) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-gray-300">{label}</span>
    <div className="flex gap-1">
      <button className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs ${access.read ? 'bg-neon-blue text-black' : 'bg-gray-800 text-gray-500'}`}>R</button>
      <button className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs ${access.write ? 'bg-neon-blue text-black' : 'bg-gray-800 text-gray-500'}`}>W</button>
      <button className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs ${access.append ? 'bg-neon-blue text-black' : 'bg-gray-800 text-gray-500'}`}>A</button>
      {access.control !== undefined && (
        <button className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs ${access.control ? 'bg-neon-blue text-black' : 'bg-gray-800 text-gray-500'}`}>C</button>
      )}
    </div>
  </div>
);

const PermissionButton = ({ mode, active, onClick, inherited }) => (
  <button
    onClick={onClick}
    className={`
      w-6 h-6 rounded flex items-center justify-center font-mono text-xs
      ${active ? 'bg-neon-blue text-black' : 'bg-gray-800 text-gray-500'}
      ${inherited ? 'ring-1 ring-gray-600' : ''}
      hover:bg-neon-blue-bright hover:text-black
      transition-colors
    `}
    title={`${mode} access is ${active ? 'enabled' : 'disabled'}${inherited ? ' (inherited)' : ''}`}
  >
    {mode}
  </button>
);

const RestrictClient = ({ yourAccess, publicAccess, inherited = false }) => {
  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState('');
  const [modes, setModes] = useState({
    read: false,
    write: false,
    append: false
  });
  const [error] = useState(null);

  const handleAddAccess = async (e) => {
    e.preventDefault();
    // ... existing access handling logic ...
  };

  // Simple toggle button when form is closed
  if (!showForm) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 w-80">
        <h3 className="text-lg font-bold text-neon-blue mb-4">Permissions</h3>

        <AccessRow label="Your Access" access={yourAccess} />
        <AccessRow label="Public Access" access={publicAccess} />

        {inherited && (
          <div className="flex items-center gap-2 mt-4 p-2 bg-gray-900 rounded text-sm text-gray-400">
            <Info className="h-4 w-4" />
            <span>These permissions are inherited from a parent folder</span>
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={() => setShowForm(true)}
            className="w-6 h-6 rounded flex items-center justify-center bg-gray-800 text-neon-blue hover:bg-neon-blue hover:text-black"
            title="Add app access"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-gray-800 rounded-lg border border-neon-blue p-6 w-96 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setShowForm(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-neon-pink"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-lg font-bold text-neon-blue mb-4">Permissions</h3>

        <div className="space-y-6">
          {/* Current Access Section */}
          <div className="space-y-4">
            <AccessRow label="Your Access" access={yourAccess} />
            <AccessRow label="Public Access" access={publicAccess} />
          </div>

          <div className="border-t border-gray-700 pt-4">
            <h4 className="text-lg font-bold text-neon-blue mb-4">Add App Access</h4>

            <form onSubmit={handleAddAccess} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Application URL</label>
                <input
                  type="url"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="https://app.example.com"
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Permissions</label>
                <div className="flex gap-1">
                  <PermissionButton
                    mode="R"
                    active={modes.read}
                    onClick={() => setModes(m => ({ ...m, read: !m.read }))}
                  />
                  <PermissionButton
                    mode="W"
                    active={modes.write}
                    onClick={() => setModes(m => ({ ...m, write: !m.write }))}
                  />
                  <PermissionButton
                    mode="A"
                    active={modes.append}
                    onClick={() => setModes(m => ({ ...m, append: !m.append }))}
                  />
                </div>
              </div>

              {error && (
                <div className="text-neon-pink text-sm">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-neon-pink hover:text-neon-pink-bright"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!clientId.trim()}
                  className="px-4 py-2 text-sm bg-neon-blue hover:bg-neon-blue-bright text-black rounded disabled:opacity-50"
                >
                  Add Access
                </button>
              </div>
            </form>
          </div>

          {inherited && (
            <div className="flex items-center gap-2 mt-4 p-2 bg-gray-900 rounded text-sm text-gray-400">
              <Info className="h-4 w-4" />
              <span>These permissions are inherited from a parent folder</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestrictClient;
