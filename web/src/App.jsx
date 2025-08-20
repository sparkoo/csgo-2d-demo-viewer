import { useState } from 'react'
import { LocationProvider, Router, Route, lazy } from 'preact-iso';
import { Home } from './Index/Home'
import { PlayerApp } from './Player/PlayerApp'
import { DemoContext } from './context'

export function App() {
	const [demoData, setDemoData] = useState(null);
	return (
		<DemoContext.Provider value={{demoData, setDemoData}}>
			<LocationProvider>
				<Router>
					{/* Both of these are equivalent */}
					<Home path="/" />
					<Route path="/player" component={PlayerApp} />
					{/* <NotFound default /> */}
				</Router>
			</LocationProvider>
		</DemoContext.Provider>
	)
}
