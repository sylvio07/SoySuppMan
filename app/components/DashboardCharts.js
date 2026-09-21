'use client';

import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList,
} from 'recharts';
import { ComposableMap, Geographies, Geography, Sphere } from 'react-simple-maps';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const MAP_EMPTY = '#eef2e7';
const MAP_STEPS = ['#cfddbf', '#adc495', '#8fac6f', '#5f8446', '#234c31'];
const MAP_LEGEND_ITEMS = [
  { label: '0', color: MAP_EMPTY },
  { label: '1', color: MAP_STEPS[0] },
  { label: '2–3', color: MAP_STEPS[1] },
  { label: '4–6', color: MAP_STEPS[2] },
  { label: '7–10', color: MAP_STEPS[3] },
  { label: '11+', color: MAP_STEPS[4] },
];

const STATUS_FILLS = {
  'Qualifié': '#5f8446',
  'À vérifier': '#c5994e',
  'Rejeté': '#b96d58',
  'En attente': '#8e9b82',
  'Actif': '#6a9f50',
  'Inactif': '#a8af9e',
  'Bloqué': '#c96b5a',
};

function norm(s) {
  return (s || '').toLowerCase().trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’‘`]/g, "'")
    .replace(/-/g, ' ');
}

const FR_EN = {
  'cameroun': 'cameroon',
  "cote d'ivoire": 'ivory coast',
  'guinee': 'guinea',
  'guinee bissau': 'guinea bissau',
  'gambie': 'gambia',
  'mauritanie': 'mauritania',
  'ethiopie': 'ethiopia',
  'egypte': 'egypt',
  'tanzanie': 'tanzania',
  'ouganda': 'uganda',
  'afrique du sud': 'south africa',
  'maroc': 'morocco',
  'tunisie': 'tunisia',
  'algerie': 'algeria',
  'libye': 'libya',
  'tchad': 'chad',
  'soudan': 'sudan',
  'soudan du sud': 's. sudan',
  'republique democratique du congo': 'dem. rep. congo',
  'rdc': 'dem. rep. congo',
  'republique centrafricaine': 'central african rep.',
  'allemagne': 'germany',
  'espagne': 'spain',
  'italie': 'italy',
  'pays bas': 'netherlands',
  'belgique': 'belgium',
  'suisse': 'switzerland',
  'royaume uni': 'united kingdom',
  'etats unis': 'united states of america',
  'bresil': 'brazil',
  'mexique': 'mexico',
  'colombie': 'colombia',
  'argentine': 'argentina',
  'chine': 'china',
  'inde': 'india',
  'japon': 'japan',
  'indonesie': 'indonesia',
  'thailande': 'thailand',
  'malaisie': 'malaysia',
  'turquie': 'turkey',
  'russie': 'russia',
  'australie': 'australia',
};

function mapFill(count) {
  if (!count) return MAP_EMPTY;
  if (count <= 1) return MAP_STEPS[0];
  if (count <= 3) return MAP_STEPS[1];
  if (count <= 6) return MAP_STEPS[2];
  if (count <= 10) return MAP_STEPS[3];
  return MAP_STEPS[4];
}

const TIP_STYLE = {
  background: '#fff',
  border: '1px solid #dce4d5',
  borderRadius: 10,
  padding: '8px 14px',
  boxShadow: '0 4px 12px rgba(24,53,43,.08)',
  fontSize: 13,
};

export function WorldMap({ countryCounts }) {
  const [tip, setTip] = useState({ show: false, name: '', count: 0, x: 0, y: 0 });

  const lookup = useMemo(() => {
    const m = {};
    Object.entries(countryCounts).forEach(([name, count]) => {
      const n = norm(name);
      const key = FR_EN[n] || n;
      m[key] = (m[key] || 0) + count;
    });
    return m;
  }, [countryCounts]);

  const getCount = (geo) => lookup[norm(geo.properties.name)] || 0;
  const totalCountries = Object.keys(countryCounts).length;

  return (
    <section className="bg-white soft-card rounded-[22px] p-6 sm:p-7">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">GÉOGRAPHIE</p>
          <h2>Vos fournisseurs dans le monde.</h2>
        </div>
        <span className="text-sm" style={{ color: '#8e9b82' }}>{totalCountries} pays</span>
      </div>
      <div
        className="relative -mx-2"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          setTip((prev) => ({ ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top }));
        }}
      >
        <ComposableMap
          projectionConfig={{ rotate: [-10, 0, 0], scale: 147 }}
          height={420}
          style={{ width: '100%', height: 'auto' }}
        >
          <Sphere stroke="#dce4d5" strokeWidth={0.5} fill="transparent" />
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const count = getCount(geo);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() =>
                      setTip((prev) => ({ ...prev, show: true, name: geo.properties.name, count }))
                    }
                    onMouseLeave={() => setTip((prev) => ({ ...prev, show: false }))}
                    style={{
                      default: { fill: mapFill(count), stroke: '#fff', strokeWidth: 0.5, outline: 'none' },
                      hover: { fill: count > 0 ? '#375e3a' : '#dfe4d8', stroke: '#fff', strokeWidth: 0.8, outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>
        {tip.show && (
          <div
            className="absolute pointer-events-none z-10"
            style={{ ...TIP_STYLE, left: tip.x + 14, top: tip.y - 36, whiteSpace: 'nowrap' }}
          >
            <span style={{ fontWeight: 600, color: '#203d2a' }}>{tip.name}</span>
            <span style={{ color: '#718176', marginLeft: 8 }}>
              {tip.count} fournisseur{tip.count !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-3 px-2">
        {MAP_LEGEND_ITEMS.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="block w-4 h-3 rounded-sm"
              style={{ background: item.color, border: item.color === MAP_EMPTY ? '1px solid #dce4d5' : 'none' }}
            />
            <span className="text-xs" style={{ color: '#718176' }}>{item.label}</span>
          </div>
        ))}
        <span className="text-xs" style={{ color: '#8e9b82' }}>fournisseurs</span>
      </div>
    </section>
  );
}

export function StatusDonut({ statuses, total }) {
  const data = useMemo(
    () =>
      Object.entries(statuses)
        .map(([name, value]) => ({ name, value, color: STATUS_FILLS[name] || '#8e9b82' }))
        .sort((a, b) => b.value - a.value),
    [statuses]
  );

  if (!total) return null;

  return (
    <section className="bg-white soft-card rounded-[22px] p-6 sm:p-7">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">VOTRE RÉSEAU</p>
          <h2>Statut des fournisseurs.</h2>
        </div>
      </div>
      <div className="flex items-center gap-6 sm:gap-10">
        <div className="relative flex-shrink-0" style={{ width: 170, height: 170 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="55%"
                outerRadius="88%"
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span style={{ fontSize: 28, fontWeight: 500, color: '#203d2a', letterSpacing: '-0.04em' }}>{total}</span>
            <span style={{ fontSize: 11, color: '#718176' }}>total</span>
          </div>
        </div>
        <div className="flex-1 space-y-2.5 min-w-0">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: item.color }} />
              <span className="text-sm truncate flex-1" style={{ color: '#596e54' }}>{item.name}</span>
              <span className="text-sm font-medium tabular-nums" style={{ color: '#203d2a' }}>{item.value}</span>
              <span className="text-xs tabular-nums" style={{ color: '#8e9b82', width: 38, textAlign: 'right' }}>
                {Math.round((item.value / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TopCountriesChart({ data }) {
  if (!data?.length) return null;

  return (
    <section className="bg-white soft-card rounded-[22px] p-6 sm:p-7">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">PAYS</p>
          <h2>Fournisseurs par pays.</h2>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(data.length * 40 + 10, 100)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fontSize: 12, fill: '#596e54' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={TIP_STYLE}>
                  <div style={{ color: '#718176', marginBottom: 2 }}>{d.name}</div>
                  <div style={{ fontWeight: 600, color: '#203d2a' }}>
                    {d.count} fournisseur{d.count !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            }}
            cursor={{ fill: '#f0f5eb' }}
          />
          <Bar dataKey="count" fill="#5f8446" radius={[0, 4, 4, 0]} barSize={18}>
            <LabelList dataKey="count" position="right" style={{ fontSize: 12, fontWeight: 600, fill: '#203d2a' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

export function CategoryChart({ data }) {
  if (!data?.length) return null;

  return (
    <section className="bg-white soft-card rounded-[22px] p-6 sm:p-7">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">CATALOGUE</p>
          <h2>Produits par catégorie.</h2>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={Math.max(data.length * 40 + 10, 100)}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 44, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            tick={({ x, y, payload }) => (
              <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill="#596e54">
                {payload.value.length > 22 ? payload.value.slice(0, 22) + '…' : payload.value}
              </text>
            )}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              return (
                <div style={TIP_STYLE}>
                  <div style={{ color: '#718176', marginBottom: 2 }}>{d.name}</div>
                  <div style={{ fontWeight: 600, color: '#203d2a' }}>
                    {d.count} produit{d.count !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            }}
            cursor={{ fill: '#f0f5eb' }}
          />
          <Bar dataKey="count" fill="#c5994e" radius={[0, 4, 4, 0]} barSize={18}>
            <LabelList dataKey="count" position="right" style={{ fontSize: 12, fontWeight: 600, fill: '#203d2a' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
