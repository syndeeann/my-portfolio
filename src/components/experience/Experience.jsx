import React from 'react'
import './experience.css'
import {BsPatchCheckFill} from 'react-icons/bs'


const skillData = {
  frontEnd: [
    { id: 1, name: 'HTML', level: 'Experienced' },
    { id: 2, name: 'CSS', level: 'Intermediate' },
    { id: 3, name: 'JavaScript', level: 'Experienced' },
    { id: 4, name: 'Bootstrap', level: 'Experienced' },
    { id: 5, name: 'Tailwind', level: 'Experienced' },
    { id: 6, name: 'React', level: 'Experienced' },
    { id: 7, name: 'Angular', level: 'Experienced' }
  ],
  backEnd: [
    { id: 1, name: 'Adobe Experience Manager', level: 'Advanced' },
    { id: 3, name: 'PHP', level: 'Advanced' },
    { id: 4, name: 'SQL', level: 'Experienced' },
    { id: 5, name: 'Java Springboot', level: 'Advanced' },
    {id: 6, name: 'Dispatcher', level: 'Intermediate' },
    { id: 6, name: 'NodeJS', level: 'Intermediate' }
  ],
  dataAnalytics: [
    { id: 1, name: 'Adobe Analytics', level: 'Experienced' },
    { id: 2, name: 'Adobe Workspace', level: 'Intermediate' },
    { id: 3, name: 'Google Tag Manager', level: 'Experienced' },
    { id: 4, name: 'Google Analytics', level: 'Intermediate' },
    { id: 5, name: 'Looker Studio', level: 'Intermediate' }
  ],
  otherSkills: [
    { id: 1, name: 'Git', level: 'Experienced' },
    { id: 2, name: 'Docker', level: 'Intermediate' },
    { id: 3, name: 'AWS', level: 'Intermediate' },
    { id: 4, name: 'Agile Methodology', level: 'Experienced' },
    { id: 5, name: 'Scrum', level: 'Experienced' },
    { id: 6, name: 'Jira', level: 'Experienced' },
    { id: 7, name: 'Confluence', level: 'Experienced' },
    { id: 8, name: 'Jenkins CI/CD Pipeline', level: 'Experienced' }
  ]
}

const Experience = () => {
  const sectionTitles = {
    frontEnd: 'Frontend Development',
    backEnd: 'Backend Development',
    dataAnalytics: 'Data Analytics',
    otherSkills: 'Other Skills'
  }

  return (
    <section id="experience">
      <h5>What Skills I have</h5>
      <h2>My Experience</h2>

      <div className="container experience__container">
        {Object.entries(skillData).map(([sectionKey, skills]) => (
          <div
            key={sectionKey}
            className={`experience__${sectionKey === 'frontEnd' ? 'frontend' : sectionKey === 'backEnd' ? 'backend' : 'other'}`}>
            <h3>{sectionTitles[sectionKey]}</h3>
            <div className="experience__content">
              {skills.map((skill) => (
                <article key={`${sectionKey}-${skill.id}`} className='experience__details'>
                  <BsPatchCheckFill className="experience__details-icon"/>
                  <div>
                    <h4>{skill.name}</h4>
                    <small className='text-light'>{skill.level}</small>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Experience