import React from 'react'
import './about.css'
import ME from '../../assets/me-about.jpg'
import {FaAward} from 'react-icons/fa'
import {FiUsers} from 'react-icons/fi'
import {VscFolderLibrary} from 'react-icons/vsc'

const About = () => {
  return (
    <section id="about">
      <h5>Get To Know</h5>
      <h2>About Me</h2>

      <div className="container about__container">
        <div className="about__me">
          <div className="about__me-image">
            <img src={ME} alt="" />
          </div>
        </div>

        <div className="about__content">

          <div className="about__cards">
            <article className='about__card'>
              <FaAward className='about__icon'/>
              <h5>Experience</h5>
              <small>8+ Years Working</small>
            </article>

            <article className='about__card'>
              <FiUsers className='about__icon'/>
              <h5>Clients</h5>
              <small>10+ Clients Worldwide</small>
            </article>

            <article className='about__card'>
              <VscFolderLibrary className='about__icon'/>
              <h5>Projects</h5>
              <small>14+ Completed Projects</small>
            </article>
          </div>

          <p>
          I am a senior software developer with extensive experience designing, developing, and maintaining scalable, high-performance applications. I specialize in building clean, efficient, and maintainable code while applying best practices in architecture, security, and performance optimization. <br/><br/>Throughout my career, I have worked across the full software development lifecycle—from requirements analysis and system design to implementation, testing, and deployment. I enjoy solving complex problems, mentoring junior developers, and collaborating with cross-functional teams to deliver reliable, business-driven solutions. <br/><br/>I am passionate about continuous learning, modern technologies, and writing software that is both technically sound and impactful. My focus is on creating solutions that scale, perform, and stand the test of time.
          </p>

          <a href="#contact" className='btn btn-primary'>Let's Talk</a>
        </div>
      </div>
    </section>
  )
}

export default About