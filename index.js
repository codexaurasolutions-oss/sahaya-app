/**
 * @format
 */

import 'react-native-gesture-handler';
import 'react-native-get-random-values';
import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';

enableScreens(false);

import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
