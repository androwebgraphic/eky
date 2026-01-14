import React from 'react';
import Search from '../Search';
import DogList from './DogList';

const Home: React.FC = () => {
  return (
    <main>
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
