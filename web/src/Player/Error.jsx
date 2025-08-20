import {Component} from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {hasError: false, error: ""};
  }

  static getDerivedStateFromError(error) {
    return {hasError: true, error: error};
  }

  componentDidCatch(error, errorInfo) {
    //TODO: somehow automatically report error here
  }

  render() {
    if (this.state.hasError) {
      return (<div>
        <h1>Something went terribly wrong.</h1>
        <h3>please send me the following error, it will help a lot</h3>
        <pre>{this.state.error.message}</pre>
        <pre>{this.state.error.stack}</pre>
      </div>)
    }

    return this.props.children;
  }
}

export default ErrorBoundary
