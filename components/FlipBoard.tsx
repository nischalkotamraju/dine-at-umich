import { PawPrint } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const SCRAMBLE_STEPS = 10;
const SCRAMBLE_MS = 60;
const FLIP_MS = 160;
const COL_DELAY_MS = 45;
const GAP = 3;

function rand() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

interface TileProps {
  target: string;
  delay: number;
  tileSize: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

const Tile = ({ target, delay, tileSize, color, bgColor, borderColor }: TileProps) => {
  const H = tileSize * 1.5;
  const half = H / 2;
  const fs = tileSize * 0.68;

  const [topChar, setTopChar] = useState(' ');
  const [botChar, setBotChar] = useState(' ');
  const [flapTopChar, setFlapTopChar] = useState(' ');
  const [flapBotChar, setFlapBotChar] = useState(' ');
  const [flipping, setFlipping] = useState(false);

  const topRot = useSharedValue(0);
  const botRot = useSharedValue(90);

  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let step = 0;
    const oldChar = { current: ' ' };

    const tick = () => {
      if (step < SCRAMBLE_STEPS) {
        const c = step === SCRAMBLE_STEPS - 1 ? target.toUpperCase() : rand();
        setTopChar(c);
        setBotChar(c);
        oldChar.current = c;
        step++;
        timeout.current = setTimeout(tick, SCRAMBLE_MS);
      } else {
        const prev = oldChar.current;
        const next = target.toUpperCase();

        setFlapTopChar(prev);
        setFlapBotChar(next);
        setTopChar(next);
        setBotChar(prev);

        setFlipping(true);
        topRot.value = 0;
        botRot.value = 90;
        topRot.value = withTiming(-90, { duration: FLIP_MS });
        botRot.value = withDelay(FLIP_MS, withTiming(0, { duration: FLIP_MS }));

        timeout.current = setTimeout(() => {
          setBotChar(next);
          setFlipping(false);
          topRot.value = 0;
          botRot.value = 90;
        }, FLIP_MS * 2 + 30);
      }
    };

    timeout.current = setTimeout(tick, delay);
    return () => { if (timeout.current) clearTimeout(timeout.current); };
  }, [target, delay]);

  const topFlapStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 400 }, { rotateX: `${topRot.value}deg` }],
  }));
  const botFlapStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 400 }, { rotateX: `${botRot.value}deg` }],
  }));

  const charStyle = { color, fontWeight: '900' as const, fontSize: fs, includeFontPadding: false } as const;

  const HalfChar = ({ char, showTop }: { char: string; showTop: boolean }) => (
    <View style={{ height: half, overflow: 'hidden' }}>
      <Text style={[charStyle, {
        lineHeight: H,
        height: H,
        width: tileSize,
        textAlign: 'center',
        marginTop: showTop ? 0 : -half,
      }]}>
        {char === ' ' ? '\u00A0' : char}
      </Text>
    </View>
  );

  return (
    <View style={{ width: tileSize, height: H, backgroundColor: bgColor, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor }}>
      <HalfChar char={topChar} showTop />
      <HalfChar char={botChar} showTop={false} />

      {flipping && (
        <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, transformOrigin: 'bottom' }, topFlapStyle]}>
          <View style={{ height: half, overflow: 'hidden', backgroundColor: bgColor }}>
            <Text style={[charStyle, { lineHeight: H, height: H, width: tileSize, textAlign: 'center', marginTop: 0 }]}>
              {flapTopChar === ' ' ? '\u00A0' : flapTopChar}
            </Text>
          </View>
        </Animated.View>
      )}

      {flipping && (
        <Animated.View style={[{ position: 'absolute', bottom: 0, left: 0, right: 0, transformOrigin: 'top' }, botFlapStyle]}>
          <View style={{ height: half, overflow: 'hidden', backgroundColor: bgColor }}>
            <Text style={[charStyle, { lineHeight: H, height: H, width: tileSize, textAlign: 'center', marginTop: -half }]}>
              {flapBotChar === ' ' ? '\u00A0' : flapBotChar}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const IconTile = ({
  tileSize,
  color,
  bgColor,
  borderColor,
}: {
  tileSize: number;
  color: string;
  bgColor: string;
  borderColor: string;
}) => {
  const H = tileSize * 1.5;
  return (
    <View
      style={{
        width: tileSize,
        height: H,
        backgroundColor: bgColor,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor,
      }}
    >
      <PawPrint size={tileSize * 0.6} color={color} strokeWidth={2.5} />
    </View>
  );
};

export interface FlipBoardLine {
  text: string;
  color: string;
  suffix?: React.ReactNode;
  showClawAfter?: boolean;
}

export const FlipBoard = ({ lines, targetTileSize = 25, onComplete, isDarkMode = true }: { lines: FlipBoardLine[]; targetTileSize?: number; onComplete?: () => void; isDarkMode?: boolean }) => {
  const bgColor = isDarkMode ? '#1C1C1E' : '#FAFAFA';
  const borderColor = bgColor;
  const [containerWidth, setContainerWidth] = useState(0);
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate how many tiles fit at the target size, then expand tiles to fill exactly
  const tilesPerRow = containerWidth > 0
    ? Math.floor((containerWidth + GAP) / (targetTileSize + GAP))
    : 0;
  const tileSize = tilesPerRow > 0
    ? (containerWidth - (tilesPerRow - 1) * GAP) / tilesPerRow
    : targetTileSize;

  useEffect(() => {
    if (!onComplete || tilesPerRow === 0) return;
    // Last tile delay + scramble duration + final flip duration
    const lastTileDelay = ((lines.length - 1) * tilesPerRow + (tilesPerRow - 1)) * COL_DELAY_MS;
    const totalDuration = lastTileDelay + SCRAMBLE_STEPS * SCRAMBLE_MS + FLIP_MS * 2 + 30;
    completionTimer.current = setTimeout(onComplete, totalDuration);
    return () => { if (completionTimer.current) clearTimeout(completionTimer.current); };
  }, [tilesPerRow, onComplete]);

  return (
    <View style={{ gap: GAP }} onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      {lines.map(({ text, color, suffix, showClawAfter }, lineIdx) => {
        const chars = text.split('');
        const clawIndex = showClawAfter ? chars.length + 1 : -1;
        const totalSlots = tilesPerRow > 0 ? tilesPerRow : chars.length;

        const slots: ('char' | 'space' | 'claw')[] = [];
        for (let i = 0; i < totalSlots; i++) {
          if (showClawAfter && i === clawIndex) slots.push('claw');
          else if (i < chars.length) slots.push('char');
          else slots.push('space');
        }

        return (
          <View key={lineIdx} style={{ flexDirection: 'row', gap: GAP, alignItems: 'center' }}>
            {slots.map((slot, i) => {
              if (slot === 'claw')
                return (
                  <IconTile key={i} tileSize={tileSize} color={color} bgColor={bgColor} borderColor={borderColor} />
                );
              const char = slot === 'char' ? chars[i] : ' ';
              return (
                <Tile
                  key={i}
                  target={char}
                  delay={(lineIdx * totalSlots + i) * COL_DELAY_MS}
                  tileSize={tileSize}
                  color={color}
                  bgColor={bgColor}
                  borderColor={borderColor}
                />
              );
            })}
            {suffix}
          </View>
        );
      })}
    </View>
  );
};
