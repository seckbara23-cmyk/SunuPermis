export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 rounded-lg bg-gray-200" />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-100" />
              <div className="h-4 w-20 rounded bg-gray-100 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
