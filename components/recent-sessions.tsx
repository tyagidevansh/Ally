'use client';

import { PlusCircle, Clock, LoaderCircle, Pencil, Trash2, Info } from 'lucide-react';
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from './ui/button';
import { Label } from '@/components/ui/label';
import { TimePickerInput } from './time-picker-input';
import axios from 'axios';

interface Session {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
  duration: number;
  tag?: string;
}

const ACTIVITIES = ['Study', 'Reading', 'Coding', 'Meditation', 'Other'];

const formatTime = (ms: number) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h} hr ${String(m).padStart(2, '0')} min`;
  if (m > 0) return `${m} min ${String(s).padStart(2, '0')} sec`;
  return `${s} sec`;
};

/** Today's date string in YYYY-MM-DD (local) */
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Combine a YYYY-MM-DD string with HH, MM, SS inputs into a Date */
const buildDatetime = (dateStr: string, h: number, m: number, s: number): Date => {
  const d = new Date(dateStr);          // midnight local
  d.setHours(h, m, s, 0);
  return d;
};

/** Return the UTC calendar date a given local Date falls on, e.g. "May 23" */
const toUtcDateLabel = (d: Date): string =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** Build a human-readable explanation of the UTC offset for this browser */
const buildTimezoneTooltip = (): string => {
  const rawOffset = -new Date().getTimezoneOffset(); // minutes, positive = ahead
  const sign = rawOffset >= 0 ? '+' : '-';
  const absOff = Math.abs(rawOffset);
  const tzLabel = `UTC${sign}${Math.floor(absOff / 60)}${absOff % 60 ? ':' + String(absOff % 60).padStart(2, '0') : ''}`;
  // Local time when UTC midnight occurs
  const localMins = ((rawOffset % 1440) + 1440) % 1440;
  const lh = String(Math.floor(localMins / 60)).padStart(2, '0');
  const lm = String(localMins % 60).padStart(2, '0');
  return `Sessions are stored in UTC. Your timezone is ${tzLabel}, so UTC days start at ${lh}:${lm} local time. Sessions logged before that time count toward the previous calendar day.`;
};
const TZ_TOOLTIP = buildTimezoneTooltip();

/** Inline UTC-date hint shown below the date+time fields */
const UtcDateHint = ({ dateStr, timeDate }: { dateStr: string; timeDate: Date | undefined }) => {
  const h = timeDate ? timeDate.getHours()   : 0;
  const m = timeDate ? timeDate.getMinutes() : 0;
  const s = timeDate ? timeDate.getSeconds() : 0;
  const utcLabel = toUtcDateLabel(buildDatetime(dateStr, h, m, s));
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
      <span>Will show up on: <span className="text-gray-300 font-medium">{utcLabel}</span></span>
      <div className="relative group/tip">
        <Info className="w-3 h-3 cursor-help text-gray-600 hover:text-gray-400" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-60 p-2.5
          bg-gray-800 border border-gray-600 rounded-lg text-gray-300 leading-relaxed
          opacity-0 group-hover/tip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
          {TZ_TOOLTIP}
        </div>
      </div>
    </div>
  );
};

// ─── Shared field components ────────────────────────────────────────────────

const ActivitySelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-medium text-gray-100 mb-2">Activity</label>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-gray-800 text-white border border-gray-600 rounded-md">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-gray-800 text-white border border-gray-600 rounded-md">
        {ACTIVITIES.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
      </SelectContent>
    </Select>
  </div>
);

const DateField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="block text-sm font-medium text-gray-100 mb-2">{label}</label>
    <input
      type="date"
      value={value}
      max={todayStr()}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-gray-800 text-white border border-gray-600 rounded-md p-2 [color-scheme:dark]"
    />
  </div>
);

const TimePicker = ({
  label, dateState, setDateState, hourRef, minuteRef, secondRef,
}: {
  label: string;
  dateState: Date | undefined;
  setDateState: (d: Date | undefined) => void;
  hourRef: React.RefObject<HTMLInputElement>;
  minuteRef: React.RefObject<HTMLInputElement>;
  secondRef: React.RefObject<HTMLInputElement>;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-100 mb-2">{label}</label>
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label className="text-xs text-gray-100">HH</Label>
        <TimePickerInput picker="hours" date={dateState} setDate={setDateState} ref={hourRef}
          onRightFocus={() => minuteRef.current?.focus()}
          className="bg-gray-800 text-white border border-gray-600 rounded-md" />
      </div>
      <div className="grid gap-1 text-center">
        <Label className="text-xs text-gray-100">MM</Label>
        <TimePickerInput picker="minutes" date={dateState} setDate={setDateState} ref={minuteRef}
          onLeftFocus={() => hourRef.current?.focus()}
          onRightFocus={() => secondRef.current?.focus()}
          className="bg-gray-800 text-white border border-gray-600 rounded-md" />
      </div>
      <div className="grid gap-1 text-center">
        <Label className="text-xs text-gray-100">SS</Label>
        <TimePickerInput picker="seconds" date={dateState} setDate={setDateState} ref={secondRef}
          onLeftFocus={() => minuteRef.current?.focus()}
          className="bg-gray-800 text-white border border-gray-600 rounded-md" />
      </div>
      <div className="flex h-10 items-center">
        <Clock className="ml-1 h-4 w-4 text-gray-400" />
      </div>
    </div>
  </div>
);

// ─── Main component ─────────────────────────────────────────────────────────

const RecentSessions = () => {
  const queryClient = useQueryClient();

  // ── Add dialog state ──
  const [addOpen, setAddOpen] = useState(false);
  const [addDate, setAddDate] = useState(todayStr());
  const [addStartDate, setAddStartDate] = useState<Date | undefined>();
  const addHourRef   = useRef<HTMLInputElement>(null);
  const addMinRef    = useRef<HTMLInputElement>(null);
  const addSecRef    = useRef<HTMLInputElement>(null);
  const [addDuration, setAddDuration] = useState<number>(30);
  const [addActivity, setAddActivity] = useState('Study');
  const [addError, setAddError]     = useState('');
  const [isSavingAdd, setIsSavingAdd] = useState(false);

  // ── Edit / delete dialog state ──
  const [editOpen, setEditOpen]       = useState(false);
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [editDate, setEditDate]       = useState('');
  const [editStartDate, setEditStartDate] = useState<Date | undefined>();
  const [editDuration, setEditDuration]   = useState<number>(30);
  const [editActivity, setEditActivity]   = useState('Study');
  const [editTag, setEditTag]             = useState('');
  const editHourRef   = useRef<HTMLInputElement>(null);
  const editMinRef    = useRef<HTMLInputElement>(null);
  const editSecRef    = useRef<HTMLInputElement>(null);
  const [isSavingEdit, setIsSavingEdit]   = useState(false);
  const [isDeleting, setIsDeleting]       = useState(false);



  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['recent-sessions'],
    queryFn: async () => {
      const res = await fetch('/api/recent-times');
      const data = await res.json();
      return data.success ? data.logs : [];
    },
  });

  const invalidateAll = () => {
    ['recent-sessions', 'graph', 'focused-trends', 'comparison', 'streak'].forEach(k =>
      queryClient.invalidateQueries({ queryKey: [k] })
    );
  };

  // ── Add ──────────────────────────────────────────────────────────────────
  const handleNewLog = async () => {
    const h = parseInt(addHourRef.current?.value || '0', 10);
    const m = parseInt(addMinRef.current?.value  || '0', 10);
    const s = parseInt(addSecRef.current?.value  || '0', 10);
    const startTime = buildDatetime(addDate, h, m, s);
    const endTime   = new Date(startTime.getTime() + addDuration * 60000);

    setIsSavingAdd(true);
    try {
      await axios.post('/api/timer-log', {
        startTime: startTime.toISOString(),
        endTime:   endTime.toISOString(),
        duration:  addDuration * 60000,
        activity:  addActivity,
      });
      invalidateAll();
      setAddOpen(false);
    } finally {
      setIsSavingAdd(false);
    }
  };

  // ── Open edit dialog ─────────────────────────────────────────────────────
  const openEdit = (session: Session) => {
    const start = new Date(session.startTime);
    setEditSession(session);
    setEditDate(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`);
    setEditStartDate(start);
    setEditDuration(Math.round(session.duration / 60000));
    setEditActivity(session.activity);
    setEditTag(session.tag || '');
    setEditOpen(true);
  };

  // ── Save edit ────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editSession) return;
    const h = parseInt(editHourRef.current?.value || '0', 10);
    const m = parseInt(editMinRef.current?.value  || '0', 10);
    const s = parseInt(editSecRef.current?.value  || '0', 10);
    const startTime = buildDatetime(editDate, h, m, s);
    const endTime   = new Date(startTime.getTime() + editDuration * 60000);

    setIsSavingEdit(true);
    try {
      await axios.put(`/api/timer-log/${editSession.id}`, {
        startTime: startTime.toISOString(),
        endTime:   endTime.toISOString(),
        duration:  editDuration * 60000,
        activity:  editActivity,
        tag:       editTag || null,
      });
      invalidateAll();
      setEditOpen(false);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!editSession) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/timer-log/${editSession.id}`);
      invalidateAll();
      setEditOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };



  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-gray-500 animate-pulse text-sm">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex flex-row justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-green-500">Recent Sessions</h2>

        {/* ── Add dialog ── */}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <button className="text-green-500 cursor-pointer mb-3">
              <PlusCircle />
            </button>
          </DialogTrigger>

          <DialogContent className="bg-gray-950 text-white shadow-lg border border-gray-700 rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-green-500 text-xl">Add New Log</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <ActivitySelect value={addActivity} onChange={setAddActivity} />

              <DateField label="Date" value={addDate} onChange={setAddDate} />
              <UtcDateHint dateStr={addDate} timeDate={addStartDate} />

              <div className="flex flex-row gap-4 flex-wrap">
                <TimePicker
                  label="Start Time"
                  dateState={addStartDate}
                  setDateState={setAddStartDate}
                  hourRef={addHourRef}
                  minuteRef={addMinRef}
                  secondRef={addSecRef}
                />

                <div className="flex-1 min-w-[120px]">
                  <label className="block text-sm font-medium text-gray-100 mb-2">Duration (min)</label>
                  <input
                    type="number"
                    value={addDuration || ''}
                    min={1} max={600}
                    onChange={e => {
                      const v = Number(e.target.value);
                      if (v >= 0 && v <= 600) { setAddError(''); setAddDuration(v); }
                      else setAddError('Must be 1–600 min');
                    }}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded-md p-2"
                  />
                  {addError && <p className="text-red-500 text-xs mt-1">{addError}</p>}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button className="bg-gray-700 text-white border border-gray-600 hover:bg-gray-600"
                onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button className="bg-green-600 text-white border border-green-500 hover:bg-green-500"
                onClick={handleNewLog}
                disabled={!!addError || isSavingAdd || !addDuration}>
                {isSavingAdd && <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />}
                Add Log
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Session list */}
      <div className="space-y-2 custom-scrollbar overflow-y-auto pr-1 flex-1 min-h-0">
        {sessions.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent sessions.</p>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              className="bg-black p-3 rounded-md relative group flex flex-col transition-colors hover:bg-gray-800 cursor-pointer"
              onClick={() => openEdit(session)}
            >
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <span className="text-white text-sm font-medium">{session.activity}</span>
                  <Pencil className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                  {' – '}
                  {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>

              <div className="flex justify-between items-center mt-1">
                <span className="text-white text-sm">{formatTime(session.duration)}</span>
                <span className="text-xs text-gray-400">
                  {new Date(session.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>

              {session.tag && (
                <p className="text-xs text-green-400 mt-1 truncate">#{session.tag}</p>
              )}

              {/* Edit hint */}
              <Pencil className="absolute top-2 right-2 w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))
        )}
      </div>

      {/* ── Edit / Delete dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-gray-950 text-white shadow-lg border border-gray-700 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-green-500 text-xl">Edit Session</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <ActivitySelect value={editActivity} onChange={setEditActivity} />

            <DateField label="Date" value={editDate} onChange={setEditDate} />
            <UtcDateHint dateStr={editDate} timeDate={editStartDate} />

            <div className="flex flex-row gap-4 flex-wrap">
              <TimePicker
                label="Start Time"
                dateState={editStartDate}
                setDateState={setEditStartDate}
                hourRef={editHourRef}
                minuteRef={editMinRef}
                secondRef={editSecRef}
              />

              <div className="flex-1 min-w-[120px]">
                <label className="block text-sm font-medium text-gray-100 mb-2">Duration (min)</label>
                <input
                  type="number"
                  value={editDuration || ''}
                  min={1} max={600}
                  onChange={e => setEditDuration(Number(e.target.value))}
                  className="w-full bg-gray-800 text-white border border-gray-600 rounded-md p-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-100 mb-2">Tag (optional)</label>
              <input
                value={editTag}
                onChange={e => setEditTag(e.target.value)}
                maxLength={40}
                placeholder="e.g. chapter 4 review"
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-md p-2"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {/* Delete on the left */}
            <Button
              className="bg-red-900 text-red-300 border border-red-700 hover:bg-red-800 sm:mr-auto"
              onClick={handleDelete}
              disabled={isDeleting || isSavingEdit}
            >
              {isDeleting && <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />}
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>

            <Button className="bg-gray-700 text-white border border-gray-600 hover:bg-gray-600"
              onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 text-white border border-green-500 hover:bg-green-500"
              onClick={handleSaveEdit}
              disabled={isSavingEdit || isDeleting || !editDuration}>
              {isSavingEdit && <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  );
};

export default RecentSessions;