import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Center } from '@react-three/drei';

export default function BuildingModel() {
  const groupRef = useRef();

  // 1. CARREGAMENTO DA CIDADE POLIGONAL
  // Certifique-se de que o nome está igual ao arquivo na pasta public
  const { scene } = useGLTF('/models/cidade.glb');

  // 2. LÓGICA DE ROTAÇÃO (Focada no scroll suave)
  useFrame(() => {
    const scrollY = window.scrollY;
    if (groupRef.current) {
      // Gira devagar apenas com o scroll para dar profundidade
      groupRef.current.rotation.y = scrollY * 0.0003;
    }
  });

  return (
    // O Center alinha a cidade no meio da tela
    <Center>
      <group ref={groupRef}>
        
       
        {/* === A CIDADE POLIGONAL === */}
        <primitive 
  object={scene} 
  scale={[0.01, 0.01, 0.01]} // <-- Reduzido de 1 para 0.01
  position={[0, -4, -2]} // <-- Rebaixado e bem mais afastado para dar profundidade
  rotation={[0.1, 0, 0]} // <-- Uma leve inclinação para frente para vermos o teto dos prédios
/>
        
      </group>
    </Center>
  );
}

// Pré-carrega o modelo para performance
useGLTF.preload('/models/cidade.glb');
