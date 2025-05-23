import { useState, useEffect } from 'react';
import { Plus, X, Info, Link, ShieldCheck } from 'lucide-react';
import {
  getSolidDataset,
  getResourceInfo,
  saveSolidDatasetAt,
  hasResourceAcl,
  hasFallbackAcl,
  getAgentAccess,
  getPublicAccess,
  setAgentResourceAccess,
  createAclFromFallbackAcl,
  createAcl,
  saveAclFor
} from "@inrupt/solid-client";
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";

const QuickToggle = ({ label, active }) => (
  <button
    className={`w-5 h-5 rounded-sm flex items-center justify-center font-mono text-xs
      ${active
        ? 'bg-next-blue text-next-white'
        : 'bg-next-gray/50 text-next-white/30'}`}
    disabled
  >
    {label}
  </button>
);

const Permissions = ({ resourceUrl }) => {
  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState('');
  const [modes, setModes] = useState({
    read: true,
    write: false,
    append: false
  });
  const [error, setError] = useState(null);
  const [permissions, setPermissions] = useState({
    yourAccess: {
      read: true,
      write: false,
      append: false,
      control: false
    },
    publicAccess: {
      read: false,
      write: false
    }
  });

  useEffect(() => {
    let mounted = true;

    async function fetchPermissions() {
      try {
        const session = getDefaultSession();
        // eslint-disable-next-line no-unused-vars
        const resourceInfo = await getResourceInfo(resourceUrl, { fetch: session.fetch });
        const dataset = await getSolidDataset(resourceUrl, { fetch: session.fetch });
        const publicAccess = await getPublicAccess(dataset);
        const agentAccess = await getAgentAccess(dataset, session.info.webId);

        if (mounted) {
          setPermissions(prev => ({
            yourAccess: {
              ...agentAccess,
              read: true
            },
            publicAccess: publicAccess || prev.publicAccess
          }));
        }
      } catch {
        // Silently handle permission fetching errors
      }
    }

    if (resourceUrl) {
      fetchPermissions();
    }

    return () => {
      mounted = false;
    };
  }, [resourceUrl]);

  const handleAddAccess = async (e) => {
    e.preventDefault();
    if (!clientId.trim()) return;

    const session = getDefaultSession();
    try {
      const resourceInfo = await getResourceInfo(resourceUrl, { fetch: session.fetch });
      let dataset = await getSolidDataset(resourceUrl, { fetch: session.fetch });

      if (!hasResourceAcl(resourceInfo)) {
        const acl = hasFallbackAcl(resourceInfo)
          ? createAclFromFallbackAcl(resourceInfo)
          : createAcl(resourceInfo);
        await saveAclFor(resourceInfo, acl, { fetch: session.fetch });
      }

      dataset = setAgentResourceAccess(
        dataset,
        clientId,
        modes,
        { fetch: session.fetch }
      );

      await saveSolidDatasetAt(resourceUrl, dataset, { fetch: session.fetch });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!showForm) {
    return (
      <div className="flex items-center gap-1">
        <QuickToggle label="R" active={permissions.yourAccess.read} />
        <QuickToggle label="W" active={permissions.yourAccess.write} />
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowForm(true);
          }}
          className="ml-1 w-5 h-5 rounded-sm flex items-center justify-center bg-next-dark text-next-blue border border-next-white/10 hover:bg-next-blue hover:text-next-white"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40" onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      setShowForm(false);
    }}>
      <div className="fixed inset-0 bg-next-black/80" aria-hidden="true" />
      <div
        className="fixed right-4 top-16 next-window p-4 min-w-[300px] max-h-[calc(100vh-5rem)] overflow-y-auto z-50"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowForm(false);
          }}
          className="absolute top-2 right-2 text-next-white/50 hover:text-next-red"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4">
          <div className="flex items-center">
            <ShieldCheck className="h-4 w-4 text-next-blue mr-2" />
            <h3 className="text-next-white text-sm font-bold">Access Control</h3>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-next-black/30 rounded-sm border border-next-white/10">
            <Link className="h-4 w-4 text-next-blue flex-shrink-0" />
            <div className="text-xs font-mono text-next-white/70 break-all">
              {resourceUrl}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-next-white/60 bg-next-blue/5 p-2 rounded-sm">
            <Info className="h-3 w-3 flex-shrink-0 text-next-blue" />
            <span>Some permissions may be inherited from parent folders</span>
          </div>

          <div>
            <div className="text-next-white/60 text-xs mb-2">Your Access</div>
            <div className="flex gap-1">
              <QuickToggle label="R" active={permissions.yourAccess.read} />
              <QuickToggle label="W" active={permissions.yourAccess.write} />
              <QuickToggle label="A" active={permissions.yourAccess.append} />
              <QuickToggle label="C" active={permissions.yourAccess.control} />
            </div>
          </div>

          <div>
            <div className="text-next-white/60 text-xs mb-2">Public Access</div>
            <div className="flex gap-1">
              <QuickToggle label="R" active={permissions.publicAccess.read} />
              <QuickToggle label="W" active={permissions.publicAccess.write} />
            </div>
          </div>

          <form onSubmit={handleAddAccess} className="space-y-4 pt-2 border-t border-next-white/10" onClick={(e) => e.stopPropagation()}>
            <div>
              <h3 className="text-next-white text-sm font-bold mb-2">Add App Access</h3>
              <input
                type="url"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="https://app.example.com"
                className="next-input w-full py-1.5 px-2 text-xs"
                required
              />
            </div>

            <div className="space-y-2">
              <h4 className="text-next-white/80 text-xs">Permissions</h4>
              <div className="space-y-1.5">
                {['read', 'write', 'append'].map((mode) => (
                  <label key={mode} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={modes[mode]}
                      onChange={(e) => {
                        e.stopPropagation();
                        setModes(m => ({ ...m, [mode]: e.target.checked }));
                      }}
                      className="w-4 h-4 rounded-sm accent-next-blue"
                    />
                    <span className="text-next-white/80 capitalize">{mode}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-next-red/10 border-l-2 border-next-red p-2 text-xs rounded-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowForm(false);
                }}
                className="next-button text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!clientId.trim()}
                className="next-button-primary text-xs disabled:opacity-50"
              >
                Add Access
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Permissions;