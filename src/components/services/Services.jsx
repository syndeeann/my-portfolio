import React from 'react'
import './services.css'
import {BsCheck} from 'react-icons/bs'

const Services = () => {
  const serviceData = [
    {
      id: 1,
      title: 'UI/UX Design',
      features: [
        'User Interface (UI) Design',
        'User Experience (UX) Design',
        'Responsive & Adaptive Web Design',
        'Adobe Experience Manager (AEM) UI Development',
        'Performance & Optimization'
      ]
    },
    {
      id: 2,
      title: 'Web Development',
      features: [
        'End-to-End Web Development.',
        'Backend Development & APIs',
        'Database Architecture & Management',
        'AEM Project development, enhancements, and maintenance.',
        'Technical Consulting & Leadership'
      ]
    },
    {
      id: 3,
      title: 'Web Analytics',
      features: [
        'Web & Digital Analytics Implementation',
        'Adobe Analytics & AEM Integration',
        'Google Analytics & Google Tag Manager Integration',
        'Create Dashboards & Reports in Looker Studio',
        'Data Layer & Tracking Architecture',
        'Analytics Tool Integration',
        'Reporting & Insights'
      ]
    }
  ]
  return (
    <section id="services">
      <h5>What I offer</h5>
      <h2>Services</h2>

      <div className="container services__container">
        {serviceData.map((service) => (
          <article key={service.id} className="service">
            <div className="service__head">
              <h3>{service.title}</h3>
            </div>
            <ul className="service__list">
              {service.features.map((feature, index) => (
                <li key={index}>
                  <BsCheck className='service__list-icon' />
                  <p>{feature}</p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Services