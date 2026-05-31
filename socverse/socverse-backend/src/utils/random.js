import crypto from 'crypto';

export const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p) => Math.random() < p;

export const intIP = () => `${rnd(11, 223)}.${rnd(0, 255)}.${rnd(0, 255)}.${rnd(1, 254)}`;
export const privIP = () => `10.${rnd(0, 40)}.${rnd(0, 255)}.${rnd(2, 254)}`;
export const randHash = () => crypto.randomBytes(32).toString('hex');

export const FIRST = ['alex', 'sam', 'jordan', 'priya', 'wei', 'maria', 'omar', 'nina', 'liam', 'tara'];
export const LAST = ['lee', 'patel', 'garcia', 'chen', 'okafor', 'novak', 'ahmed', 'reyes', 'kim', 'singh'];
export const HOSTS = ['WIN-FIN-07', 'DC-CORE-01', 'WEB-DMZ-03', 'HR-WS-22', 'DB-PROD-02', 'JUMP-01', 'LNX-APP-09', 'ENG-WS-41'];
export const BAD_DOMAINS = ['update-secure-login.com', 'cdn-asset-delivery.net', 'mail-verify-account.co', 'tracking-pixel-srv.io', 'payments-portal-secure.com'];
export const BAD_URLS = ['/wp-content/x.php', '/api/v1/exfil', '/.well-known/beacon', '/dl/payload.bin', '/auth/callback?d='];

export const randUser = () => `${pick(FIRST)}.${pick(LAST)}`;
