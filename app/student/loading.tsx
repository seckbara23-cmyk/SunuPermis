export default function StudentLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23]" />
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-4 w-28 rounded bg-gray-100" />
          </div>
          <div className="h-6 w-24 rounded-full bg-gray-200" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4">
        <div className="h-4 w-32 rounded bg-gray-200 mb-3" />
        <div className="h-5 w-56 rounded bg-gray-200 mb-2" />
        <div className="h-4 w-72 rounded bg-gray-100" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4">
            <div className="h-3 w-20 rounded bg-gray-200 mb-3" />
            <div className="h-7 w-12 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  )
}
