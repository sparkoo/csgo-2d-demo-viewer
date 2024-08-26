import { useEffect, useState } from 'react';

const DemoLinkInput = (props) => {
  const [validationMessage, setValidationMessage] = useState([]);

  const onChange = function (event) {
    event.preventDefault()
    const demoLink = event.target.demoLinkInput.value
    if (demoLink.endsWith(".dem.gz")) {
      setValidationMessage("")
      const playerLink = window.location.origin + "/player?platform=upload&matchId=" + demoLink
      // console.log(playerLink)
      window.open(playerLink)
    } else {
      setValidationMessage("this does not look like demo link")
    }
  }
  return (
    <div className='w3-container'>
      <form className="w3-container w3-card-8" onSubmit={onChange}>
        <input type='text' name='demoLinkInput' className='w3-input w3-border w3-xlarge' placeholder='Paste link to demo here' />
      </form>
      {validationMessage.length > 0 &&
        <div className='w3-panel w3-pale-red w3-leftbar w3-border-red'>
          <p>{validationMessage}</p>
        </div>
      }

    </div>
  )
}

export default DemoLinkInput;
