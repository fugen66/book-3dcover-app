import React, { useRef, useState, useEffect } from 'react';

type BookPreset = 'thin' | 'medium' | 'thick';

interface ImagesState {
  frontUrl: string | null;
  spineUrl: string | null;
}

const PRESET_CONFIG: Record<BookPreset, { spineWidthPercent: number }> = {
  thin: { spineWidthPercent: 5 },    // узкий корешок
  medium: { spineWidthPercent: 10 }, // средний
  thick: { spineWidthPercent: 18 }   // толстый
};

function App() {
  const [preset, setPreset] = useState<BookPreset>('medium');
  const [images, setImages] = useState<ImagesState>({ frontUrl: null, spineUrl: null });
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Загружаем файл и получаем dataURL
  const handleImageUpload = (type: 'front' | 'spine') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImages(prev => ({
        ...prev,
        [type === 'front' ? 'frontUrl' : 'spineUrl']: typeof reader.result === 'string' ? reader.result : null
      }));
    };
    reader.readAsDataURL(file);
  };

  const canRenderBook = !!images.frontUrl;

  // Генерация итогового изображения (PNG / JPEG)
  const downloadImage = async (format: 'png' | 'jpeg') => {
    if (!images.frontUrl) return;

    const frontImg = new Image();
    frontImg.src = images.frontUrl;
    await new Promise((res, rej) => {
      frontImg.onload = () => res(true);
      frontImg.onerror = rej;
    });

    const spineImg = new Image();
    if (images.spineUrl) {
      spineImg.src = images.spineUrl;
      await new Promise((res, rej) => {
        spineImg.onload = () => res(true);
        spineImg.onerror = rej;
      });
    }

    // Размер итогового изображения
    const resultWidth = 1600;
    const resultHeight = 2400;

    const canvas = document.createElement('canvas');
    canvas.width = resultWidth;
    canvas.height = resultHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Фон
    ctx.fillStyle = '#0b1120';
    ctx.fillRect(0, 0, resultWidth, resultHeight);

    // Параметры книги
    const config = PRESET_CONFIG[preset];
    const spineWidth = (resultWidth * config.spineWidthPercent) / 100;
    const coverWidth = resultWidth - spineWidth - 200; // немного отступа справа
    const coverHeight = resultHeight - 400;
    const baseX = 100;
    const baseY = 200;

    // Корешок (если задан)
    if (images.spineUrl) {
      ctx.save();
      ctx.translate(baseX + spineWidth / 2, baseY + coverHeight / 2);
      ctx.transform(1, 0.2, 0, 1, 0, 0); // лёгкая псевдо перспектива
      ctx.drawImage(spineImg, -spineWidth / 2, -coverHeight / 2, spineWidth, coverHeight);
      ctx.restore();
    } else {
      // Однотонный корешок, если картинки нет
      ctx.save();
      ctx.translate(baseX + spineWidth / 2, baseY + coverHeight / 2);
      ctx.transform(1, 0.2, 0, 1, 0, 0);
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-spineWidth / 2, -coverHeight / 2, spineWidth, coverHeight);
      ctx.restore();
    }

    // Фронтальная обложка
    ctx.save();
    const frontX = baseX + spineWidth;
    const frontY = baseY;
    ctx.translate(frontX + coverWidth / 2, frontY + coverHeight / 2);
    ctx.transform(1, 0.1, -0.05, 1, 0, 0); // лёгкий наклон
    ctx.drawImage(frontImg, -coverWidth / 2, -coverHeight / 2, coverWidth, coverHeight);
    ctx.restore();

    // Тень под книгой
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.filter = 'blur(40px)';
    ctx.beginPath();
    ctx.ellipse(resultWidth / 2, baseY + coverHeight + 120, resultWidth / 3, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'jpeg' ? 0.95 : undefined;
    const dataUrl = canvas.toDataURL(mime, quality as any);

    const link = document.createElement('a');
    link.download = format === 'png' ? 'book-3d-cover.png' : 'book-3d-cover.jpg';
    link.href = dataUrl;
    link.click();
  };

  // Визуальный превью блок (CSS 3D)
  const config = PRESET_CONFIG[preset];

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#e5e7eb', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '16px 24px', borderBottom: '1px solid #111827' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>3D обложка книги (CSS 3D, без заморочек)</h1>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
          Загрузи готовую обложку (и корешок, если нужно) → выбери толщину → скачай PNG или JPEG.
        </p>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'row', padding: '16px', gap: '16px' }}>
        {/* Левая панель */}
        <div style={{ width: '320px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ padding: '12px', borderRadius: '8px', background: '#020617', border: '1px solid #111827' }}>
            <h2 style={{ fontSize: '14px', margin: '0 0 8px' }}>1. Лицевая обложка</h2>
            <input type="file" accept="image/*" onChange={handleImageUpload('front')} />
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Готовый макет обложки из Canva (JPG/PNG).
            </p>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', background: '#020617', border: '1px solid #111827' }}>
            <h2 style={{ fontSize: '14px', margin: '0 0 8px' }}>2. Корешок</h2>
            <input type="file" accept="image/*" onChange={handleImageUpload('spine')} />
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
              Узкий макет для корешка (можно однотонный фон с текстом). Если не загрузишь — будет однотонный корешок.
            </p>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', background: '#020617', border: '1px solid #111827' }}>
            <h2 style={{ fontSize: '14px', margin: '0 0 8px' }}>3. Толщина книги</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="preset"
                  value="thin"
                  checked={preset === 'thin'}
                  onChange={() => setPreset('thin')}
                />
                Тонкая
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="preset"
                  value="medium"
                  checked={preset === 'medium'}
                  onChange={() => setPreset('medium')}
                />
                Средняя
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="radio"
                  name="preset"
                  value="thick"
                  checked={preset === 'thick'}
                  onChange={() => setPreset('thick')}
                />
                Толстая
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <button
              onClick={() => downloadImage('png')}
              disabled={!canRenderBook}
              style={{
                padding: '10px 16px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: canRenderBook ? 'pointer' : 'not-allowed',
                background: canRenderBook ? '#22c55e' : '#374151',
                color: '#0b1120'
              }}
            >
              Скачать PNG
            </button>
            <button
              onClick={() => downloadImage('jpeg')}
              disabled={!canRenderBook}
              style={{
                padding: '10px 16px',
                borderRadius: '9999px',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: canRenderBook ? 'pointer' : 'not-allowed',
                background: canRenderBook ? '#fbbf24' : '#374151',
                color: '#0b1120'
              }}
            >
              Скачать JPEG
            </button>
          </div>
        </div>

        {/* Правая часть — превью книги в CSS 3D */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: '1200px',
            background: 'radial-gradient(circle at top, #1f2937 0, #020617 60%)',
            borderRadius: '12px',
            border: '1px solid #111827',
            minHeight: '400px'
          }}
        >
          {canRenderBook ? (
            <div
              style={{
                position: 'relative',
                width: '260px',
                height: '400px',
                transformStyle: 'preserve-3d',
                transform: 'rotateY(-25deg) rotateX(10deg)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.8)'
              }}
            >
              {/* Корешок */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${config.spineWidthPercent}%`,
                  height: '100%',
                  backgroundImage: images.spineUrl ? `url(${images.spineUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: images.spineUrl ? undefined : '#111827',
                  transformOrigin: 'left center',
                  transform: 'rotateY(90deg) translateZ(0px)'
                }}
              />

              {/* Фронтальная обложка */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${config.spineWidthPercent}%`,
                  width: `${100 - config.spineWidthPercent}%`,
                  height: '100%',
                  backgroundImage: `url(${images.frontUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backfaceVisibility: 'hidden',
                  borderRadius: '4px 6px 6px 4px',
                  overflow: 'hidden'
                }}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', opacity: 0.4, fontSize: '14px' }}>
              Сначала загрузите хотя бы лицевую обложку.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
