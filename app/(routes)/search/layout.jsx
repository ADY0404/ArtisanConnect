import React from 'react'

function layout({children}) {
  return (
    <div>
        <div className='grid grid-cols-1 mt-8'>
            <div>
            {children}
            </div>
        </div>
        </div>
  )
}

export default layout