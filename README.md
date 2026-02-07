# 🎮 Favela Wars FPS

Um jogo FPS realista no navegador usando Babylon.js. Tema: Polícia vs Bandidos em uma favela do Rio de Janeiro.

![Babylon.js](https://img.shields.io/badge/Babylon.js-4.2-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 🎯 Sobre o Jogo

Favela Wars é um FPS single-player onde você escolhe entre ser um policial do BOPE ou um membro do crime organizado. Seu objetivo é eliminar todos os inimigos do time oposto em um ambiente de favela com múltiplos níveis, becos estreitos e cobertura tática.

### Características

- **Escolha de Lado**: Polícia (BOPE) ou Bandido
- **3 Armas Principais**: Shotgun, Sniper ou AR-15
- **Armas Secundárias**: Pistola, Faca e Granada
- **IA Inimiga**: NPCs com comportamento de patrulha, detecção visual e combate
- **Mapa de Favela**: Ambiente procedural com barracos, escadas, lajes e becos
- **Gráficos PBR**: Iluminação realista com materiais físicos

## 🚀 Como Jogar

### Opção 1: Abrir Diretamente
Simplesmente abra o arquivo `index.html` no seu navegador (Chrome, Firefox, Edge).

> ⚠️ Alguns navegadores podem bloquear recursos locais. Se tiver problemas, use a Opção 2.

### Opção 2: Servidor Local
```bash
# Com Python 3
cd favela-fps
python -m http.server 8080

# Com Node.js (npx)
npx serve .

# Com PHP
php -S localhost:8080
```

Depois acesse: `http://localhost:8080`

### Opção 3: Deploy Estático
Faça upload para qualquer serviço de hospedagem estática:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

## 🎮 Controles

| Tecla | Ação |
|-------|------|
| W/A/S/D | Movimento |
| Mouse | Olhar/Mirar |
| Click Esquerdo | Atirar |
| Click Direito | Mirar (zoom com sniper) |
| R | Recarregar |
| 1 | Arma Principal |
| 2 | Pistola |
| 3 | Faca |
| G | Granada |
| Shift | Correr |
| Ctrl | Agachar |
| Space | Pular |
| ESC | Pausar |

## 🔫 Armas

### Armas Principais (escolha uma)

| Arma | Dano | Alcance | Tipo |
|------|------|---------|------|
| **Shotgun** | Alto (8 pellets) | Curto | Pump Action |
| **Sniper** | Muito Alto | Longo | Bolt Action |
| **AR-15** | Médio | Médio | Automático |

### Armas Secundárias (todos começam com)

- **Pistola**: Semi-automática, versátil
- **Faca**: Melee, insta-kill por trás
- **Granada**: Explosão com dano em área

## 🏗️ Estrutura do Projeto

```
favela-fps/
├── index.html          # Página principal
├── README.md           # Este arquivo
├── css/
│   └── style.css       # Estilos do jogo e UI
├── js/
│   ├── main.js         # Entry point
│   ├── game/
│   │   ├── Game.js     # Controlador principal
│   │   ├── Player.js   # Controlador do jogador
│   │   ├── Weapons.js  # Sistema de armas
│   │   ├── NPC.js      # IA dos inimigos
│   │   └── Map.js      # Gerador do mapa
│   ├── ui/
│   │   └── Menu.js     # Sistema de menus
│   └── utils/
│       └── helpers.js  # Funções utilitárias
└── assets/
    └── textures/       # Texturas (procedurais por padrão)
```

## 🐛 Debug

Abra o console do navegador (F12) para acessar comandos de debug:

```javascript
DEBUG.godMode()      // Vida infinita
DEBUG.giveAmmo()     // Munição infinita
DEBUG.killAll()      // Eliminar todos os inimigos
DEBUG.teleport(x,y,z) // Teleportar para posição
DEBUG.showFPS()      // Mostrar FPS no console
DEBUG.listNPCs()     // Listar status dos NPCs
```

## 🔧 Tecnologias

- **Babylon.js 5.x**: Engine 3D
- **Cannon.js**: Física
- **Web Audio API**: Sons procedurais
- **Pointer Lock API**: Controle do mouse

## 📝 Notas Técnicas

### Performance
- O jogo usa PBR materials com iluminação dinâmica
- Shadow mapping para sombras realistas
- Post-processing: bloom, FXAA, tone mapping
- LOD automático do Babylon.js

### IA dos NPCs
- Estado de patrulha com pontos aleatórios
- Detecção visual com campo de visão e raycasting
- Comportamento de combate com strafing
- Alerta de NPCs próximos quando um é atacado

### Física
- Movimento do jogador com física capsule
- Granadas com trajetória balística
- Colisão com cenário

## 🎨 Customização

### Adicionar Texturas
Substitua os materiais procedurais em `Map.js` por texturas de:
- [Poly Haven](https://polyhaven.com/)
- [ambientCG](https://ambientcg.com/)

### Modificar Armas
Edite `WeaponData` em `Weapons.js`:
```javascript
const WeaponData = {
    [WeaponTypes.AR15]: {
        damage: 28,      // Dano por tiro
        fireRate: 100,   // ms entre tiros
        magSize: 30,     // Balas no pente
        // ...
    }
};
```

### Ajustar Dificuldade
Modifique os valores em `NPC.js`:
```javascript
this.accuracy = 0.6;      // Precisão (0-1)
this.reactionTime = 500;  // Tempo de reação (ms)
this.viewDistance = 40;   // Distância de visão
```

## 📜 Licença

MIT License - Sinta-se livre para usar, modificar e distribuir.

## 🙏 Créditos

- **Engine**: [Babylon.js](https://www.babylonjs.com/)
- **Física**: [Cannon.js](https://schteppe.github.io/cannon.js/)
- **Inspiração**: Clássicos do gênero FPS

---

**Divirta-se! 🎮**
