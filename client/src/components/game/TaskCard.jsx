import { statusBadgeClass } from '../../lib/gameSelectors';

export default function TaskCard({ task, suffix = '', showFakeLabel = true }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 flex justify-between gap-3 items-center">
      <div>
        <p className="text-sm font-black text-white">
          {task.label}
          {suffix}
        </p>
        <p className="text-[11px] uppercase tracking-wider text-gray-400">
          {task.station}
          {showFakeLabel && task.isFake ? ' - fake' : ''}
          {!task.isFake ? ' - real' : ''}
        </p>
      </div>
      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${statusBadgeClass(task.status)}`}>
        {task.status}
      </span>
    </div>
  );
}
