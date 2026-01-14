import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

type User = {
  _id?: string;
  id?: string;
  username?: string;
  name?: string;
  phone?: string;
};

const Users: React.FC = () => {
  const { t } = useTranslation();
  const [listOfUsers, setListOfUsers] = useState<User[]>([]);

  useEffect(() => {
    let mounted = true;
    axios.get('/getUsers').then((response) => {
      if (mounted && Array.isArray(response.data)) setListOfUsers(response.data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main>
      <h2>{t('users.title')}</h2>
      {listOfUsers.length === 0 ? (
        <p>{t('users.empty')}</p>
      ) : (
        <ul>
          {listOfUsers.map((u, i) => (
            <li key={u._id || u.id || i}>{u.username || u.name || JSON.stringify(u)}</li>
          ))}
        </ul>
      )}
    </main>
  );
};

export default Users;
