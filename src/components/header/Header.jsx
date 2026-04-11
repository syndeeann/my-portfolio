import React from 'react'
import './header.css'
import CTA from './CTA'
import ME from '../../assets/me.png'
import {BiArrowToBottom} from 'react-icons/bi'
import HeaderSocials from './HeaderSocials'

const Header = () => {
  return (
    <header>
      <div className="container header__container">
        <h5>Hello I'm</h5>
        <h1>Syndee Ann Sevilla</h1>
        <h5 className="text-light">Tech-Savvy Virtual Assistant | Web Development | Analytics</h5>
        <CTA />
    
        <HeaderSocials />

        <div className="me">
          <img src={ME} alt="" />
        </div>

        <a href='#contact' className="scroll__down"><BiArrowToBottom /></a>
      </div>
    </header>
  )
}

export default Header