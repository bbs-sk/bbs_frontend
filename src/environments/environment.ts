import packageInfo from '../../package.json';

export const environment = {
  appVersion: packageInfo.version,
  production: false,
  apiUrl: 'http://localhost:3000/api'
  //apiUrl: 'https://bbs-backend-three.vercel.app/api'
};
