import React from 'react'
import './services.css'
import {BsCheck} from 'react-icons/bs'

const Services = () => {
  return (
    <section id="services">
      <h5>What I offer</h5>
      <h2>Services</h2>

      <div className="container services__container">
        <article className="service">
          <div className="service__head">
            <h3>UI/UX Design</h3>
          </div>
          <ul className="service__list">
            <li>
              <BsCheck className='service__list-icon' />
              <p>User Interface (UI) Design </p>
            </li>
            <li>
              <BsCheck className='service__list-icon' />
              <p>User Experience (UX) Design </p>
            </li>
            <li>
              <BsCheck className='service__list-icon' />
              <p>Responsive & Adaptive Web Design </p>
            </li>
            <li>
              <BsCheck className='service__list-icon' />
              <p>Adobe Experience Manager (AEM) UI Development </p>
            </li>
            <li>
              <BsCheck className='service__list-icon' />
              <p>I Performance & Optimization </p>
            </li>
          </ul>
        </article>
        {/*END UI/UX*/}

        <article className="service">
          <div className="service__head">
            <h3>Web Development</h3>
          </div>
          <ul className="service__list">
            <li>
              <BsCheck className='service__list-icon' />
              <p>End-to-End Web Development. </p>
            </li>
            <li>
              <BsCheck className='service__list-icon' />
              <p>Backend Development & APIs </p>
            </li>
            <li>
              <BsCheck className='service__list-icon' />
              <p>Database Architecture & Management </p>
            </li>
            <li>
              <BsCheck className='service__list-icon' />
              <p>AEM Project development, enhancements, and maintenance. </p>
            </li>
            <li>
              <BsCheck className='service__list-icon' />
              <p>Technical Consulting & Leadership </p>
            </li>
          </ul>
        </article>
        {/*END Web Development*/}

        <article className="service">
          <div className="service__head">
            <h3>Web Analytics</h3>
          </div>
          <ul className="service__list">
            <li>
              <BsCheck className='service__list-icon' />
              <p>Web & Digital Analytics Implementation </p>
            </li>
            <li>
              <BsCheck className='service__list-icon' />
              <p>Adobe Analytics & AEM Integration </p>
            </li>
            <li>
              <BsCheck className='service__list-icon' />
              <p>Data Layer & Tracking Architecture </p>
            </li>
            <li>
              <BsCheck className='service__list-icon' />
              <p>Analytics Tool Integration </p>
            </li>
            <li>
              <BsCheck className='service__list-icon' />
              <p>Reporting & Insights</p>
            </li>
          </ul>
        </article>
        {/*END Content Creation*/}
      </div>
    </section>
  )
}

export default Services