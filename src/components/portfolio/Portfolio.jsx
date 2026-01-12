import React from 'react'
import './portfolio.css'
import IMG1 from '../../assets/portfolio1.png'
import IMG2 from '../../assets/portfolio2.png'
import IMG3 from '../../assets/portfolio3.png'

const data = [
  {
    id: 1,
    image: IMG1,
    title: 'DRTREFI School Website (Public Website)',
    demo: "https://drtrefi.edu.ph/"
  },

  {
    id: 2,
    image: IMG2,
    title: 'Barangay Management System (Private)',
    demo: ""
  },

  {
    id: 3,
    image: IMG3,
    title: 'Company Projects (Project are private and confidential)',
    demo: ""
  }
]


const Portfolio = () => {
  return (
    <section id="portfolio">
      <h5>My Recent Work</h5>
      <h2>Portfolio</h2>

      <div className="container porfolio__container">
        {
          data.map(({id, image, title, github, demo}) => {
            return (
              <article key={id} className="portfolio__item">
              <div className="portfolio__item-image">
                <img src={image} alt={title} />
              </div>
              <h3>{title}</h3>
              <div class="portfolio__item-cta">
                <a href={demo} className='btn btn-primary' target="_blank">Live Demo</a>
              </div>
            </article>
            )
          })
        }
        

      </div>
    </section>
  )
}

export default Portfolio