import { Highlight, themes } from 'prism-react-renderer';
import { X } from 'lucide-react';

const FileViewer = ({ url, content, type, onClose }) => {
  const isJson = (str) => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const formatJson = (jsonString) => {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2);
    } catch {
      return jsonString;
    }
  };

  return (
    <div className="fixed inset-0 bg-next-black/80 flex items-center justify-center z-50">
      <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
        {/* No floating close button - using NeXTSTEP's window management */}
        <div className="next-window overflow-hidden shadow-next-window">
          {/* NeXTSTEP-style title bar */}
          <div className="next-title-bar">
            <div className="next-title-text flex items-center">
              <span className="truncate">{url.split('/').pop()}</span>
              <span className="text-xs ml-2 opacity-70">({type.split('/')[1]})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border border-next-border"></div>
              <button
                onClick={onClose}
                className="text-next-white text-xs hover:text-next-white/60 transition-colors"
                aria-label="Close file viewer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* NeXTSTEP-style file viewer content */}
          <div className="bg-next-white text-next-black border-t border-next-border overflow-hidden" style={{ maxHeight: "calc(80vh - 40px)" }}>
            <div className="overflow-auto h-full max-h-[calc(80vh-40px)]"> 
              {type.includes('json') && isJson(content) ? (
                <div className="bg-next-white h-full overflow-auto">
                  <Highlight
                    theme={{
                      ...themes.github,
                      plain: { color: "#000000", backgroundColor: "#FFFFFF" },
                      styles: [
                        ...themes.github.styles,
                        { types: ["comment"], style: { color: "#666666" }},
                        { types: ["string"], style: { color: "#0066CC" }},
                        { types: ["keyword"], style: { color: "#000000", fontWeight: "bold" }}
                      ]
                    }}
                    code={formatJson(content)}
                    language="json"
                  >
                    {({ tokens, getLineProps, getTokenProps }) => (
                      <pre className="p-2 text-sm font-mono" style={{color: "#000000", backgroundColor: "#FFFFFF"}}>
                        <table>
                          <tbody>
                            {tokens.map((line, i) => (
                              <tr key={i} {...getLineProps({ line, key: i })}>
                                <td className="text-next-gray pr-4 select-none w-10 text-right">
                                  {i + 1}
                                </td>
                                <td>
                                  {line.map((token, key) => (
                                    <span key={key} {...getTokenProps({ token, key })} />
                                  ))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </pre>
                    )}
                  </Highlight>
                </div>
              ) : (
                <pre className="p-2 text-next-black text-sm overflow-auto whitespace-pre-wrap font-mono bg-next-white h-full">
                  {content}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileViewer;