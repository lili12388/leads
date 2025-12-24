export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Extension License System</h1>
        <p className="text-gray-400 mb-8">API for managing browser extension licenses</p>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔐 Public Endpoints</h2>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex items-center space-x-2">
              <span className="bg-green-600 px-2 py-1 rounded text-xs">POST</span>
              <span>/api/v1/license/activate</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-green-600 px-2 py-1 rounded text-xs">POST</span>
              <span>/api/v1/license/validate</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🛡️ Admin Endpoints</h2>
          <p className="text-gray-400 text-sm mb-4">Requires Authorization: Bearer ADMIN_SECRET</p>
          <div className="space-y-2 text-sm font-mono">
            <div className="flex items-center space-x-2">
              <span className="bg-yellow-600 px-2 py-1 rounded text-xs">POST</span>
              <span>/api/v1/admin/licenses/create</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 px-2 py-1 rounded text-xs">GET</span>
              <span>/api/v1/admin/licenses/create</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-yellow-600 px-2 py-1 rounded text-xs">POST</span>
              <span>/api/v1/admin/licenses/revoke</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-yellow-600 px-2 py-1 rounded text-xs">POST</span>
              <span>/api/v1/admin/licenses/reset-activations</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 px-2 py-1 rounded text-xs">GET</span>
              <span>/api/v1/admin/licenses/[id]/status</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 px-2 py-1 rounded text-xs">GET</span>
              <span>/api/v1/admin/licenses/[id]/audit</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-600 px-2 py-1 rounded text-xs">GET</span>
              <span>/api/v1/admin/stats</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📖 Quick Start</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Set up environment variables (see .env.example)</li>
            <li>Run: <code className="bg-gray-700 px-2 py-1 rounded">npx prisma db push</code></li>
            <li>Use admin CLI to create licenses</li>
            <li>Integrate license-client.js into your extension</li>
          </ol>
        </div>
        
        <footer className="mt-8 text-center text-gray-500 text-sm">
          License System v1.0.0
        </footer>
      </div>
    </main>
  );
}
