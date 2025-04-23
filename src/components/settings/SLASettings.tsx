import React, { useState, useEffect } from 'react';
import {
  fetchSLAs,
  createSLA,
  updateSLA,
  deleteSLA,
  fetchBusinessHours,
  updateBusinessHours,
  fetchHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../../services/slaService';
import { SLA, BusinessHours, Holiday } from '../../types/database';
import { Button } from '../ui/Button';

const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const SLASettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'slas'|'business'|'holidays'>('slas');

  // SLAs
  const [slas, setSlas] = useState<SLA[]>([]);
  const [loadingSLAs, setLoadingSLAs] = useState(false);
  const [editingSLA, setEditingSLA] = useState<SLA| null>(null);
  const [formSLA, setFormSLA] = useState<Omit<SLA,'id'|'created_at'|'updated_at'>>({
    name:'', description:null, response_time_minutes:0, resolution_time_minutes:0,
    priority:'', is_active:true, business_hours_only:true,
    escalation_time_minutes:null, escalation_user_id:null, escalation_group_id:null,
    notification_template:null, applies_to:null
  });

  // Business hours
  const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);

  // Holidays
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(()=>{ if(activeTab==='slas') loadSLAs();
    if(activeTab==='business') loadBusiness();
    if(activeTab==='holidays') loadHols();
  },[activeTab]);

  const loadSLAs = async()=>{ setLoadingSLAs(true);
    try { const data=await fetchSLAs(); setSlas(data);}catch(e){console.error(e);} finally{setLoadingSLAs(false);} };
  const loadBusiness = async()=>{ const data=await fetchBusinessHours(); setBusinessHours(data);} ;
  const loadHols = async()=>{ const data=await fetchHolidays(); setHolidays(data);} ;

  const handleSLASubmit = async(e:React.FormEvent)=>{
    e.preventDefault();
    if(editingSLA) {
      await updateSLA(editingSLA.id, formSLA);
    } else {
      await createSLA(formSLA);
    }
    setEditingSLA(null); loadSLAs();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">SLA Settings</h2>
      <nav className="flex space-x-4 mb-6">
        <Button variant="ghost" onClick={()=>setActiveTab('slas')} className={activeTab==='slas'?'text-primary':'text-gray-500'}>SLAs</Button>
        <Button variant="ghost" onClick={()=>setActiveTab('business')} className={activeTab==='business'?'text-primary':'text-gray-500'}>Business Hours</Button>
        <Button variant="ghost" onClick={()=>setActiveTab('holidays')} className={activeTab==='holidays'?'text-primary':'text-gray-500'}>Holidays</Button>
      </nav>

      {activeTab==='slas'&&(
        <div>
          <Button onClick={()=>{setEditingSLA(null); setFormSLA({ ...formSLA, name:'', response_time_minutes:0, resolution_time_minutes:0, priority:'', description:null, notification_template:null, applies_to:null, escalation_time_minutes:null, escalation_user_id:null, escalation_group_id:null, is_active:true, business_hours_only:true });}} className="mb-4">Add SLA</Button>
          <table className="w-full mb-4">
            <thead><tr><th>Name</th><th>Response (min)</th><th>Resolution (min)</th><th>Priority</th><th>Actions</th></tr></thead>
            <tbody>
              {slas.map(s=> (
                <tr key={s.id} className="border-t">
                  <td>{s.name}</td>
                  <td>{s.response_time_minutes}</td>
                  <td>{s.resolution_time_minutes}</td>
                  <td>{s.priority}</td>
                  <td>
                    <Button size="sm" onClick={()=>{setEditingSLA(s); setFormSLA({ name:s.name, description:s.description, response_time_minutes:s.response_time_minutes, resolution_time_minutes:s.resolution_time_minutes, priority:s.priority, is_active:s.is_active, business_hours_only:s.business_hours_only, escalation_time_minutes:s.escalation_time_minutes, escalation_user_id:s.escalation_user_id, escalation_group_id:s.escalation_group_id, notification_template:s.notification_template, applies_to:s.applies_to || null });}}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={()=>{deleteSLA(s.id).then(loadSLAs);}}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(editingSLA!==null||true)&&(
            <form onSubmit={handleSLASubmit} className="bg-gray-50 p-4 rounded mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label>Name</label>
                  <input name="name" value={formSLA.name} onChange={e=>setFormSLA(prev=>({ ...prev, name:e.target.value }))} required className="w-full border p-2" />
                </div>
                <div>
                  <label>Description</label>
                  <input name="description" value={formSLA.description||''} onChange={e=>setFormSLA(prev=>({ ...prev, description:e.target.value }))} className="w-full border p-2" />
                </div>
                <div>
                  <label>Response Time (min)</label>
                  <input type="number" value={formSLA.response_time_minutes} onChange={e=>setFormSLA(prev=>({ ...prev, response_time_minutes:parseInt(e.target.value) }))} className="w-full border p-2" />
                </div>
                <div>
                  <label>Resolution Time (min)</label>
                  <input type="number" value={formSLA.resolution_time_minutes} onChange={e=>setFormSLA(prev=>({ ...prev, resolution_time_minutes:parseInt(e.target.value) }))} className="w-full border p-2" />
                </div>
                <div>
                  <label>Priority</label>
                  <input name="priority" value={formSLA.priority} onChange={e=>setFormSLA(prev=>({ ...prev, priority:e.target.value }))} className="w-full border p-2" />
                </div>
                <div className="flex items-center">
                  <input type="checkbox" checked={formSLA.is_active} onChange={e=>setFormSLA(prev=>({ ...prev, is_active:e.target.checked }))} /> Active
                </div>
                <div className="flex items-center">
                  <input type="checkbox" checked={formSLA.business_hours_only} onChange={e=>setFormSLA(prev=>({ ...prev, business_hours_only:e.target.checked }))} /> Business Hours Only
                </div>
              </div>
              <Button type="submit" className="mt-4">Save SLA</Button>
            </form>
          )}
        </div>
      )}

      {activeTab==='business'&&(
        <div>
          <h3 className="text-lg mb-4">Business Hours</h3>
          <table className="w-full mb-4">
            <thead><tr><th>Day</th><th>Start</th><th>End</th><th>Working</th><th>Action</th></tr></thead>
            <tbody>
              {businessHours.map(b=> (
                <tr key={b.id} className="border-t">
                  <td>{days[b.day_of_week]}</td>
                  <td><input type="time" defaultValue={b.start_time} onBlur={e=>updateBusinessHours(b.id,{ start_time:e.target.value })} className="border p-1" /></td>
                  <td><input type="time" defaultValue={b.end_time} onBlur={e=>updateBusinessHours(b.id,{ end_time:e.target.value })} className="border p-1" /></td>
                  <td><input type="checkbox" defaultChecked={b.is_working_day} onChange={e=>updateBusinessHours(b.id,{ is_working_day:e.target.checked })} /></td>
                  <td><Button size="sm" onClick={loadBusiness}>Refresh</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab==='holidays'&&(
        <div>
          <h3 className="text-lg mb-4">Holidays</h3>
          <table className="w-full mb-4">
            <thead><tr><th>Name</th><th>Date</th><th>Recurring</th><th>Actions</th></tr></thead>
            <tbody>
              {holidays.map(h=> (
                <tr key={h.id} className="border-t">
                  <td>{h.name}</td>
                  <td>{h.date}</td>
                  <td>{h.is_recurring? 'Yes':'No'}</td>
                  <td>
                    <Button size="sm" onClick={()=>{/* TODO edit holiday */}}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={()=>{deleteHoliday(h.id).then(loadHols);}}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h4 className="mt-4">Add Holiday</h4>
          <form onSubmit={async e=>{ e.preventDefault(); const name=(e.target as any).name.value; const date=(e.target as any).date.value; const recur=(e.target as any).is_recurring.checked; await createHoliday({ name, date, is_recurring:recur }); loadHols(); }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><input name="name" placeholder="Name" required className="w-full border p-2" /></div>
            <div><input name="date" type="date" required className="w-full border p-2" /></div>
            <div className="flex items-center space-x-2"><input name="is_recurring" type="checkbox" /> Recurring</div>
            <div><Button type="submit">Add Holiday</Button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SLASettings;
