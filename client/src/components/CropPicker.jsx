import './CropPicker.css';

// Real Pexels/Wikimedia images — bright, ultra-clear, high-contrast, recognisable even on dim screens
export const CROPS = [
  { name:'Tomato',       nepali:'गोलभेडा',       hindiName:'tomato',      fallback:'#C0392B',
    img:'https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Potato',       nepali:'आलु',            hindiName:'potato',      fallback:'#B7950B',
    img:'https://images.pexels.com/photos/2286776/pexels-photo-2286776.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Onion',        nepali:'प्याज',          hindiName:'pyaj',        fallback:'#9B59B6',
    img:'https://images.pexels.com/photos/175727/pexels-photo-175727.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Cabbage',      nepali:'बन्दा',          hindiName:'banda',       fallback:'#27AE60',
    img:'https://images.pexels.com/photos/2329440/pexels-photo-2329440.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Cauliflower',  nepali:'काउली',          hindiName:'kauli',       fallback:'#E8E8D8',
    img:'https://images.pexels.com/photos/3641159/pexels-photo-3641159.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Carrot',       nepali:'गाजर',           hindiName:'gajar',       fallback:'#E67E22',
    img:'https://images.pexels.com/photos/1268101/pexels-photo-1268101.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Chili',        nepali:'खुर्सानी',      hindiName:'khursani',    fallback:'#E74C3C',
    img:'https://images.pexels.com/photos/40141/pexels-photo-40141.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Capsicum',     nepali:'भेडे खुर्सानी', hindiName:'capsicum',    fallback:'#E74C3C',
    img:'https://images.pexels.com/photos/594137/pexels-photo-594137.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Eggplant',     nepali:'भण्टा',          hindiName:'bhanta',      fallback:'#7D3C98',
    img:'https://images.pexels.com/photos/321551/pexels-photo-321551.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Cucumber',     nepali:'काँक्रो',       hindiName:'kakro',       fallback:'#1E8449',
    img:'https://images.pexels.com/photos/37528/pexels-photo-37528.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Pumpkin',      nepali:'फर्सी',          hindiName:'pharsi',      fallback:'#E8700A',
    img:'https://images.pexels.com/photos/1567069/pexels-photo-1567069.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Garlic',       nepali:'लसुन',           hindiName:'lasun',       fallback:'#D5D5C5',
    img:'https://images.pexels.com/photos/51517/garlic-spice-ingredient-food-51517.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Ginger',       nepali:'अदुवा',          hindiName:'aduwa',       fallback:'#CA9B5A',
    img:'https://images.pexels.com/photos/1191798/pexels-photo-1191798.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Beans',        nepali:'सिमी',           hindiName:'simi',        fallback:'#229954',
    img:'https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Corn',         nepali:'मकै',            hindiName:'makai',       fallback:'#F1C40F',
    img:'https://images.pexels.com/photos/1459339/pexels-photo-1459339.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Orange',       nepali:'सुन्तला',       hindiName:'suntala',     fallback:'#F39C12',
    img:'https://images.pexels.com/photos/327098/pexels-photo-327098.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Banana',       nepali:'केरा',           hindiName:'kera',        fallback:'#F7DC6F',
    img:'https://images.pexels.com/photos/1166648/pexels-photo-1166648.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Mango',        nepali:'आँप',            hindiName:'amp',         fallback:'#F0A500',
    img:'https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Lemon',        nepali:'कागती',         hindiName:'kagati',      fallback:'#F9E547',
    img:'https://images.pexels.com/photos/1414130/pexels-photo-1414130.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Broccoli',     nepali:'हरियो काउली',  hindiName:'broccoli',    fallback:'#1A6B2A',
    img:'https://images.pexels.com/photos/1382102/pexels-photo-1382102.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Sweet Potato', nepali:'मिठो आलु',     hindiName:'mitho aalu',  fallback:'#A04000',
    img:'https://images.pexels.com/photos/89247/pexels-photo-89247.jpeg?auto=compress&cs=tinysrgb&w=800' },
  { name:'Wheat',        nepali:'गहुँ',           hindiName:'gahun',       fallback:'#C9A227',
    img:'https://images.pexels.com/photos/326082/pexels-photo-326082.jpeg?auto=compress&cs=tinysrgb&w=800' },
];

export function searchCrops(query) {
  if (!query) return CROPS;
  const q = query.toLowerCase();
  return CROPS.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.nepali.includes(q) ||
    c.hindiName.toLowerCase().includes(q)
  );
}

// TikTok-style: image covers 62% of the card, text overlaid bottom-left
export default function CropPicker({ selected, onSelect, kalimatiRates }) {
  return (
    <div className="crop-scroll-list">
      {CROPS.map(crop => {
        const km    = kalimatiRates?.[crop.name];
        const price = km?.available ? `रू ${km.kalimatiMin}–${km.kalimatiMax}` : null;
        const isSel = selected?.name === crop.name;
        return (
          <button
            key={crop.name}
            className={`crop-card ${isSel ? 'crop-card-selected' : ''}`}
            onClick={() => onSelect(crop)}
          >
            {/* IMAGE — covers 62% of the card height */}
            <div className="crop-card-img-wrap">
              <img
                src={crop.img}
                alt={crop.nepali}
                className="crop-card-img"
                loading="lazy"
              />
              {/* dark gradient at bottom for text readability */}
              <div className="crop-card-gradient" />

              {/* TEXT overlaid bottom-left — like a TikTok caption */}
              <div className="crop-card-caption">
                <div className="crop-card-name nepali">{crop.nepali}</div>
                {price && (
                  <div className="crop-card-price nepali">बजार मूल्य: {price} / किलो</div>
                )}
              </div>

              {/* Selected checkmark top-right */}
              {isSel && (
                <div className="crop-card-sel-badge">✓ छानियो</div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
