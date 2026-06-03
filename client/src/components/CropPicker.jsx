import './CropPicker.css';

// Nepali crop names for complete voice + display
export const CROPS = [
  { name: 'Tomato',       nepali: 'गोलभेडा',    img: '/images/tomato.png',   fallback: '#E74C3C' },
  { name: 'Potato',       nepali: 'आलु',         img: '/images/potato.png',   fallback: '#C4A35A' },
  { name: 'Onion',        nepali: 'प्याज',       img: '/images/onion.png',    fallback: '#9B59B6' },
  { name: 'Cabbage',      nepali: 'बन्दा',       img: '/images/cabbage.png',  fallback: '#27AE60' },
  { name: 'Cauliflower',  nepali: 'काउली',       img: null,                   fallback: '#F0EAD6' },
  { name: 'Carrot',       nepali: 'गाजर',        img: null,                   fallback: '#E67E22' },
  { name: 'Chili',        nepali: 'खुर्सानी',   img: null,                   fallback: '#C0392B' },
  { name: 'Capsicum',     nepali: 'भेडे खुर्सानी', img: null,                 fallback: '#28B463' },
  { name: 'Eggplant',     nepali: 'भण्टा',       img: null,                   fallback: '#7D3C98' },
  { name: 'Cucumber',     nepali: 'काँक्रो',    img: null,                   fallback: '#1E8449' },
  { name: 'Pumpkin',      nepali: 'फर्सी',       img: null,                   fallback: '#E8700A' },
  { name: 'Garlic',       nepali: 'लसुन',        img: null,                   fallback: '#F8F9FA' },
  { name: 'Ginger',       nepali: 'अदुवा',       img: null,                   fallback: '#C4A35A' },
  { name: 'Beans',        nepali: 'सिमी',        img: null,                   fallback: '#2ECC71' },
  { name: 'Corn',         nepali: 'मकै',         img: null,                   fallback: '#F1C40F' },
  { name: 'Rice',         nepali: 'धान',         img: null,                   fallback: '#F0E68C' },
  { name: 'Orange',       nepali: 'सुन्तला',    img: null,                   fallback: '#F39C12' },
  { name: 'Banana',       nepali: 'केरा',        img: null,                   fallback: '#F7DC6F' },
  { name: 'Mango',        nepali: 'आँप',         img: null,                   fallback: '#F39C12' },
  { name: 'Lemon',        nepali: 'कागती',       img: null,                   fallback: '#F9E547' },
  { name: 'Pineapple',    nepali: 'भुइँकटहर',  img: null,                   fallback: '#EDBB37' },
  { name: 'Sweet Potato', nepali: 'मिठो आलु',  img: null,                   fallback: '#A04000' },
  { name: 'Broccoli',     nepali: 'हरियो काउली', img: null,                  fallback: '#186A3B' },
  { name: 'Wheat',        nepali: 'गहुँ',        img: null,                   fallback: '#D4AC0D' },
];

export default function CropPicker({ selected, onSelect }) {
  return (
    <div className="crop-picker">
      {CROPS.map(crop => (
        <button
          key={crop.name}
          className={`crop-card ${selected?.name === crop.name ? 'crop-selected' : ''}`}
          onClick={() => onSelect(crop)}
        >
          <div className="crop-img-wrap" style={{ background: crop.fallback + '22' }}>
            {crop.img ? (
              <img src={crop.img} alt={crop.name} className="crop-img"
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
            ) : null}
            <div className="crop-fallback" style={{ background: crop.fallback, display: crop.img ? 'none' : 'flex' }}>
              {crop.nepali[0]}
            </div>
          </div>
          <div className="crop-nepali nepali">{crop.nepali}</div>
          {selected?.name === crop.name && <div className="crop-check">✓</div>}
        </button>
      ))}
    </div>
  );
}
