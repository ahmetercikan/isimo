/**
 * Konfeti — canvas-confetti, ama ayrı iş parçacığı (Worker + OffscreenCanvas) olmadan.
 *
 * Kütüphanenin varsayılanı tuvali bir Worker'a devreder. Bazı Android telefonlarda (vivo Y19s,
 * Unisoc + Mali-G57; 21 Eki 2026) uygulama arka plana gidip gelince (ör. reklama dokunup dönünce)
 * o tuval GPU'suz çizime düşüyor; WebView onu ekrana koyamıyor ("CanvasResourceRasterGmbMappable"
 * hatası) ve konfeti sürdükçe bütün oyun ekranı bembeyaz kalıyordu — "Harfimiz" anında ~4 sn.
 * Aynı tuval ana iş parçacığında çizilince sorun yok.
 */
import canvasConfetti from 'canvas-confetti';

export const confetti = canvasConfetti.create(undefined, { resize: true, useWorker: false });
