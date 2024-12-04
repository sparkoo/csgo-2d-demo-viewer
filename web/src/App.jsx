import { LocationProvider, Router, Route, lazy } from 'preact-iso';
import { Home } from './Index/Home'
import { PlayerApp } from './Player/App'

export function App() {
	return <LocationProvider>
		<Router>
			{/* Both of these are equivalent */}
			<Home path="/" />
			<Route path="/player" component={PlayerApp} />
			{/* <NotFound default /> */}
		</Router>
	</LocationProvider>
}
