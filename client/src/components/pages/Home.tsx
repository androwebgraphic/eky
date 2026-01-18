import React from 'react';
import Search from '../Search';
import DogList from './DogList';

const Home: React.FC = () => {
  return (
    <main>
       <h1>TEST APLIKACIJA</h1>
      <Search 
        searchTerm={''}
        onSearchChange={() => {}}
        genderFilter={''}
        onGenderChange={() => {}}
        sizeFilter={''}
        onSizeChange={() => {}}
        locationFilter={''}
        onLocationChange={() => {}}
        availableLocations={[]}
      />
      <DogList />
    </main>
  );
};

export default Home;
