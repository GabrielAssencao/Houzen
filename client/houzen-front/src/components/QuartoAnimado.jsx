import { useRef, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

// 1. COMPONENTE QUE LIDA COM O MODELO 3D
function ModeloQuarto({ isHovered }) {
  const { scene } = useGLTF('/models/room.glb'); 
  const quartoRef = useRef();

  // useFrame roda a 60 frames por segundo. Aqui controlamos o giro!
  useFrame((state, delta) => {
    if (quartoRef.current) {
      // Se o mouse estiver em cima, gira rápido. Se não, gira bem devagarzinho
      const velocidade = isHovered ? 2.5 : 0.3;
      quartoRef.current.rotation.y += delta * velocidade;
    }
  });

  return (
    <primitive 
      object={scene} 
      ref={quartoRef} 
      // Como a escala global nativa do quarto é pequena (1.37), 
      // nós aumentamos ele em 3.5 vezes para preencher bem o espaço na tela.
      scale={[1.2, 1, 1]} 
      // Ajustei levemente o eixo Y para centralizar melhor a base do quarto
      position={[0, -0.5, 0]} 
    />
  );
}

// 2. COMPONENTE PRINCIPAL (MISTURA CSS COM O CANVAS 3D)
export default function QuartoAnimado() {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      className="d-flex justify-content-center align-items-center w-100 h-100 position-relative" 
      style={{ minHeight: '400px', cursor: 'pointer' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Brilho Laranja no fundo */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '280px',
        height: '280px',
        background: 'radial-gradient(circle, rgba(249,115,22,0.3) 0%, rgba(249,115,22,0) 70%)',
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.4s ease',
        zIndex: 0,
        pointerEvents: 'none'
      }}></div>

      {/* O Canvas do R3F que renderiza o modelo 3D */}
      <div style={{ width: '100%', height: '100%', zIndex: 1 }}>
        <Canvas camera={{ position: [0, 2, 6], fov: 45 }}>
          <ambientLight intensity={1.5} />
          {/* Luzes direcionais para dar volume ao quarto */}
          <directionalLight position={[10, 10, 5]} intensity={2.5} color="#F97316" />
          <directionalLight position={[-10, 10, -5]} intensity={1} color="#ffffff" />
          
          <Suspense fallback={null}>
            <ModeloQuarto isHovered={hovered} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}
