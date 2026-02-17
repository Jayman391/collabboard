interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

const COLORS = [
  '#FDFD96', '#FFB7B2', '#B5EAD7', '#C7CEEA', '#FFD8B1',
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD',
  '#FFE66D', '#A8E6CF', '#FF8B94', '#B8B8D1', '#F3D250',
];

export function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 4,
        background: 'rgba(26, 26, 46, 0.9)',
        borderRadius: 12,
        padding: '6px 12px',
        backdropFilter: 'blur(8px)',
        zIndex: 10,
      }}
    >
      {COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onColorChange(color)}
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: color,
            border: color === selectedColor ? '2px solid #fff' : '2px solid transparent',
            cursor: 'pointer',
            padding: 0,
            outline: selectedColor === color ? '2px solid #6c63ff' : 'none',
            outlineOffset: 1,
          }}
        />
      ))}
    </div>
  );
}
